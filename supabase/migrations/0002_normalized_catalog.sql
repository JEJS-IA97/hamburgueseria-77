-- Normaliza el menú para que ingredientes repetidos tengan una sola fila y
-- productos, variantes, extras, combos y promociones apunten a esa lista.
create table if not exists public.ingredients(
 id uuid primary key default gen_random_uuid(),
 name text not null,
 normalized_name text not null unique,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.dish_ingredients(
 dish_id uuid not null references public.dishes(id) on delete cascade,
 ingredient_id uuid not null references public.ingredients(id),
 note text not null default '',
 primary key(dish_id,ingredient_id)
);
create table if not exists public.dish_extra_ingredients(
 dish_id uuid not null references public.dishes(id) on delete cascade,
 ingredient_id uuid not null references public.ingredients(id),
 price_clp integer not null default 0 check(price_clp>=0),
 is_included boolean not null default false,
 primary key(dish_id,ingredient_id)
);
alter table public.dishes add column if not exists code text;
alter table public.dishes add column if not exists size text not null default '';
alter table public.dishes add column if not exists product_type text not null default 'dish' check(product_type in('dish','combo'));
alter table public.dishes add column if not exists components jsonb not null default '[]';
alter table public.dishes add column if not exists payment_conditions text not null default '';
alter table public.dishes add column if not exists extra_selection_limit integer not null default 0 check(extra_selection_limit>=0);
alter table public.dishes add column if not exists sales_days text[] not null default '{}';
alter table public.dishes add column if not exists price_min_clp integer;
alter table public.dishes add column if not exists price_max_clp integer;
alter table public.promotions add column if not exists price_clp integer check(price_clp is null or price_clp>=0);
alter table public.promotions add column if not exists record_type text not null default 'promotion' check(record_type in('promotion','combo'));
alter table public.promotions add column if not exists components jsonb not null default '[]';
alter table public.promotions add column if not exists payment_conditions text not null default '';
alter table public.promotions add column if not exists weekdays text[] not null default '{}';
create table if not exists public.promotion_ingredients(
 promotion_id uuid not null references public.promotions(id) on delete cascade,
 ingredient_id uuid not null references public.ingredients(id),
 primary key(promotion_id,ingredient_id)
);
alter table public.ingredients enable row level security;
alter table public.dish_ingredients enable row level security;
alter table public.dish_extra_ingredients enable row level security;
alter table public.promotion_ingredients enable row level security;
create policy "public reads active ingredients" on public.ingredients for select using(active or public.is_admin());
create policy "admins manage ingredients" on public.ingredients for all using(public.is_admin()) with check(public.is_admin());
create policy "public reads dish ingredients" on public.dish_ingredients for select using(exists(select 1 from public.dishes d where d.id=dish_id and (d.available or public.is_admin())));
create policy "admins manage dish ingredients" on public.dish_ingredients for all using(public.is_admin()) with check(public.is_admin());
create policy "public reads dish extras" on public.dish_extra_ingredients for select using(exists(select 1 from public.dishes d where d.id=dish_id and (d.available or public.is_admin())));
create policy "admins manage dish extras" on public.dish_extra_ingredients for all using(public.is_admin()) with check(public.is_admin());
create policy "public reads promotion ingredients" on public.promotion_ingredients for select using(exists(select 1 from public.promotions p where p.id=promotion_id and p.active));
create policy "admins manage promotion ingredients" on public.promotion_ingredients for all using(public.is_admin()) with check(public.is_admin());

drop policy if exists "public reads active promotions" on public.promotions;
create policy "public reads active promotions" on public.promotions for select using(
 active and (starts_at is null or starts_at<=(timezone('America/Santiago',now()))::date)
 and (ends_at is null or ends_at>=(timezone('America/Santiago',now()))::date)
 and (cardinality(weekdays)=0 or
   (extract(isodow from timezone('America/Santiago',now()))=2 and 'Martes'=any(weekdays)) or
   (extract(isodow from timezone('America/Santiago',now()))=3 and 'Miércoles'=any(weekdays)))
);
drop policy if exists "public reads available dishes" on public.dishes;
create policy "public reads available dishes" on public.dishes for select using(
 available and (cardinality(sales_days)=0 or
   (extract(isodow from timezone('America/Santiago',now()))=2 and 'Martes'=any(sales_days)) or
   (extract(isodow from timezone('America/Santiago',now()))=3 and 'Miércoles'=any(sales_days))
 ) or public.is_admin()
);

create or replace function public.valid_chilean_rut(raw text) returns boolean
language plpgsql immutable as $$
declare cleaned text; body text; digit text; acc integer:=0; factor integer:=2; idx integer; remn integer; expected text;
begin
 cleaned:=regexp_replace(upper(coalesce(raw,'')),'[^0-9K]','','g');
 if length(cleaned)<8 or length(cleaned)>10 then return false; end if;
 body:=left(cleaned,length(cleaned)-1); digit:=right(cleaned,1);
 for idx in reverse length(body)..1 loop
  acc:=acc+substring(body,idx,1)::integer*factor; factor:=case when factor=7 then 2 else factor+1 end;
 end loop;
 remn:=11-(acc%11);
 expected:=case when remn=11 then '0' when remn=10 then 'K' else remn::text end;
 return expected=digit;
end $$;

create or replace function public.create_order(p_customer jsonb,p_items jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare line jsonb; dish_row public.dishes; qty int; line_total int; total int:=0; items_snapshot jsonb:='[]'::jsonb; saved public.orders; mode_value text; extra_name text; extra_row record; selected_count int;
begin
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'El pedido está vacío'; end if;
 mode_value:=p_customer->>'mode';
 if mode_value not in('delivery','pickup','table') then raise exception 'Modalidad inválida'; end if;
 if length(trim(coalesce(p_customer->>'name','')))<2 or length(trim(coalesce(p_customer->>'phone','')))<7 or not public.valid_chilean_rut(p_customer->>'rut') then raise exception 'Nombre, teléfono y RUT válido son obligatorios'; end if;
 if mode_value='delivery' and length(trim(coalesce(p_customer->>'address','')))<5 then raise exception 'Falta la dirección'; end if;
 if mode_value='table' and length(trim(coalesce(p_customer->>'table_number','')))<1 then raise exception 'Falta el número de mesa'; end if;
 for line in select * from jsonb_array_elements(p_items) loop
  select * into dish_row from public.dishes where id=(line->>'dish_id')::uuid and available=true and (cardinality(sales_days)=0 or (extract(isodow from timezone('America/Santiago',now()))=2 and 'Martes'=any(sales_days)) or (extract(isodow from timezone('America/Santiago',now()))=3 and 'Miércoles'=any(sales_days)));
  if not found or dish_row.price_clp is null then raise exception 'Plato no disponible'; end if;
  qty:=greatest(1,least(20,(line->>'quantity')::int)); line_total:=dish_row.price_clp*qty;
  selected_count:=case when jsonb_typeof(line->'extras')='array' then jsonb_array_length(line->'extras') else 0 end;
  if selected_count<>(select count(distinct value) from jsonb_array_elements_text(coalesce(line->'extras','[]'::jsonb))) then raise exception 'No repitas ingredientes extra'; end if;
  if dish_row.extra_selection_limit>0 and selected_count<>dish_row.extra_selection_limit then raise exception 'Selecciona exactamente % ingredientes para %',dish_row.extra_selection_limit,dish_row.name; end if;
  if selected_count>0 then
   for extra_name in select jsonb_array_elements_text(line->'extras') loop
    select ei.price_clp,ei.is_included into extra_row from public.dish_extra_ingredients ei join public.ingredients i on i.id=ei.ingredient_id where ei.dish_id=dish_row.id and i.name=extra_name;
    if not found then raise exception 'Ingrediente extra no disponible: %',extra_name; end if;
    line_total:=line_total+extra_row.price_clp*qty;
   end loop;
  end if;
  total:=total+line_total;
  items_snapshot:=items_snapshot||jsonb_build_array(jsonb_build_object('dish_id',dish_row.id,'name',dish_row.name,'size',dish_row.size,'quantity',qty,'unit_price_clp',dish_row.price_clp,'extras',coalesce(line->'extras','[]'::jsonb),'line_total_clp',line_total));
 end loop;
 insert into public.orders(customer_name,customer_phone,customer_rut,mode,address,table_number,notes,items,total_clp)
 values(trim(p_customer->>'name'),trim(p_customer->>'phone'),trim(p_customer->>'rut'),mode_value,nullif(trim(p_customer->>'address'),''),nullif(trim(p_customer->>'table_number'),''),coalesce(p_customer->>'notes',''),items_snapshot,total) returning * into saved;
 return jsonb_build_object('id',saved.id,'number',saved.order_number,'total_clp',saved.total_clp);
end $$;
grant execute on function public.create_order(jsonb,jsonb) to anon,authenticated;
