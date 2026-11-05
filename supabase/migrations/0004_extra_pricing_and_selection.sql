-- Normaliza precios de extras y cuenta por separado las elecciones incluidas.
update public.dish_extra_ingredients ei
set price_clp = case
  when ei.is_included then 0
  when lower(coalesce(d.category_name, '')) like '%pizza%'
    and (translate(lower(coalesce(d.size, '')), 'áéíóúüñ', 'aeiouun') like '%mediana%'
      or translate(lower(coalesce(d.size, '')), 'áéíóúüñ', 'aeiouun') like '%mediano%')
    and (translate(lower(i.name), 'áéíóúüñ', 'aeiouun') like '%palmit%'
      or translate(lower(i.name), 'áéíóúüñ', 'aeiouun') like '%pina%') then 2000
  when lower(coalesce(d.category_name, '')) like '%pizza%'
    and (translate(lower(coalesce(d.size, '')), 'áéíóúüñ', 'aeiouun') like '%familiar%'
      or translate(lower(coalesce(d.size, '')), 'áéíóúüñ', 'aeiouun') like '%grande%')
    and (translate(lower(i.name), 'áéíóúüñ', 'aeiouun') like '%palmit%'
      or translate(lower(i.name), 'áéíóúüñ', 'aeiouun') like '%pina%') then 3000
  when lower(coalesce(d.category_name, '')) like '%pizza%'
    and (translate(lower(coalesce(d.size, '')), 'áéíóúüñ', 'aeiouun') like '%mediana%'
      or translate(lower(coalesce(d.size, '')), 'áéíóúüñ', 'aeiouun') like '%mediano%')
    and translate(lower(i.name), 'áéíóúüñ', 'aeiouun') ~ 'tocino|camaron|queso|carne|pollo' then 3000
  when lower(coalesce(d.category_name, '')) like '%pizza%'
    and (translate(lower(coalesce(d.size, '')), 'áéíóúüñ', 'aeiouun') like '%familiar%'
      or translate(lower(coalesce(d.size, '')), 'áéíóúüñ', 'aeiouun') like '%grande%')
    and translate(lower(i.name), 'áéíóúüñ', 'aeiouun') ~ 'tocino|camaron|queso|carne|pollo' then 4000
  else 1500
end
from public.dishes d, public.ingredients i
where d.id = ei.dish_id
  and i.id = ei.ingredient_id;

-- Permite registrar combos del catálogo de promociones y aplicar los precios
-- actualizados de ingredientes extra al total validado por el servidor.
create or replace function public.create_order(p_customer jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  line jsonb;
  dish_row public.dishes;
  promotion_row public.promotions;
  qty integer;
  line_total integer;
  total integer := 0;
  items_snapshot jsonb := '[]'::jsonb;
  saved public.orders;
  mode_value text;
  extra_name text;
  extra_row record;
  selected_count integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido está vacío';
  end if;

  mode_value := p_customer->>'mode';
  if mode_value not in ('delivery', 'pickup', 'table') then raise exception 'Modalidad inválida'; end if;
  if length(trim(coalesce(p_customer->>'name', ''))) < 2
     or length(trim(coalesce(p_customer->>'phone', ''))) < 7
     or not public.valid_chilean_rut(p_customer->>'rut') then
    raise exception 'Nombre, teléfono y RUT válido son obligatorios';
  end if;
  if mode_value = 'delivery' and length(trim(coalesce(p_customer->>'address', ''))) < 5 then raise exception 'Falta la dirección'; end if;
  if mode_value = 'table' and length(trim(coalesce(p_customer->>'table_number', ''))) < 1 then raise exception 'Falta el número de mesa'; end if;

  for line in select * from jsonb_array_elements(p_items) loop
    qty := greatest(1, least(20, coalesce((line->>'quantity')::integer, 1)));

    if line ? 'promotion_id' then
      select * into promotion_row
      from public.promotions p
      where p.id = (line->>'promotion_id')::uuid
        and p.active = true
        and p.record_type = 'combo'
        and (p.starts_at is null or p.starts_at <= (timezone('America/Santiago', now()))::date)
        and (p.ends_at is null or p.ends_at >= (timezone('America/Santiago', now()))::date)
        and (cardinality(p.weekdays) = 0
          or (extract(isodow from timezone('America/Santiago', now())) = 2 and 'Martes' = any(p.weekdays))
          or (extract(isodow from timezone('America/Santiago', now())) = 3 and 'Miércoles' = any(p.weekdays)));
      if not found or promotion_row.price_clp is null then raise exception 'Combo no disponible'; end if;
      line_total := promotion_row.price_clp * qty;
      total := total + line_total;
      items_snapshot := items_snapshot || jsonb_build_array(jsonb_build_object(
        'item_type', 'combo',
        'promotion_id', promotion_row.id,
        'name', promotion_row.title,
        'description', promotion_row.description,
        'components', coalesce(promotion_row.components, '[]'::jsonb),
        'payment_conditions', promotion_row.payment_conditions,
        'quantity', qty,
        'unit_price_clp', promotion_row.price_clp,
        'extras', '[]'::jsonb,
        'line_total_clp', line_total
      ));
    else
      select * into dish_row
      from public.dishes d
      where d.id = (line->>'dish_id')::uuid
        and d.available = true
        and (cardinality(d.sales_days) = 0
          or (extract(isodow from timezone('America/Santiago', now())) = 2 and 'Martes' = any(d.sales_days))
          or (extract(isodow from timezone('America/Santiago', now())) = 3 and 'Miércoles' = any(d.sales_days)));
      if not found or dish_row.price_clp is null then raise exception 'Plato no disponible'; end if;

      line_total := dish_row.price_clp * qty;
      selected_count := 0;
      if line ? 'extras' and jsonb_typeof(line->'extras') <> 'array' then
        raise exception 'Formato de extras inválido';
      end if;
      if jsonb_typeof(line->'extras') = 'array' then
        if jsonb_array_length(line->'extras') <> (select count(distinct value) from jsonb_array_elements_text(line->'extras')) then
          raise exception 'No repitas ingredientes extra';
        end if;
      end if;
      if jsonb_typeof(line->'extras') = 'array' and jsonb_array_length(line->'extras') > 0 then
        for extra_name in select jsonb_array_elements_text(line->'extras') loop
          select ei.price_clp, ei.is_included into extra_row
          from public.dish_extra_ingredients ei
          join public.ingredients i on i.id = ei.ingredient_id
          where ei.dish_id = dish_row.id and i.name = extra_name;
          if not found then raise exception 'Ingrediente extra no disponible: %', extra_name; end if;
          if extra_row.is_included then selected_count := selected_count + 1; end if;
          line_total := line_total + extra_row.price_clp * qty;
        end loop;
      end if;
      if dish_row.extra_selection_limit > 0 and selected_count <> dish_row.extra_selection_limit then
        raise exception 'Selecciona exactamente % ingredientes incluidos para %', dish_row.extra_selection_limit, dish_row.name;
      end if;
      total := total + line_total;
      items_snapshot := items_snapshot || jsonb_build_array(jsonb_build_object(
        'item_type', case when dish_row.product_type = 'combo' then 'combo' else 'dish' end,
        'dish_id', dish_row.id,
        'name', dish_row.name,
        'category', coalesce(dish_row.category_name, ''),
        'size', dish_row.size,
        'components', coalesce(dish_row.components, '[]'::jsonb),
        'description', dish_row.description,
        'quantity', qty,
        'unit_price_clp', dish_row.price_clp,
        'extras', coalesce(line->'extras', '[]'::jsonb),
        'line_total_clp', line_total
      ));
    end if;
  end loop;

  insert into public.orders(customer_name, customer_phone, customer_rut, mode, address, table_number, notes, items, total_clp)
  values(trim(p_customer->>'name'), trim(p_customer->>'phone'), trim(p_customer->>'rut'), mode_value,
    nullif(trim(p_customer->>'address'), ''), nullif(trim(p_customer->>'table_number'), ''),
    coalesce(p_customer->>'notes', ''), items_snapshot, total)
  returning * into saved;

  return jsonb_build_object('id', saved.id, 'number', saved.order_number, 'total_clp', saved.total_clp);
end;
$$;

grant execute on function public.create_order(jsonb, jsonb) to anon, authenticated;
