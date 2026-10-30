"""Build repeatable Supabase SQL seed data from the two owner-provided menus."""
from __future__ import annotations
import hashlib, json, re, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'supabase' / 'seed.sql'
SOURCE_FILES = [ROOT / 'menu_general.md', ROOT / 'menu_y_promociones.md']
NAMESPACE = uuid.UUID('a5b23cf1-7e20-4d87-b663-8e5c0f202677')

ALIASES = {
    'mayo':'mayonesa','maíz':'choclo','maíz (choclo)':'choclo','tomates':'tomate',
    'porotos verdes':'poroto verde','poroto verde':'poroto verde','pepinillos':'pepinillo',
    'palta en rodajas':'palta','palta en rodaja':'palta','aceitunas negras':'aceituna','aceitunas':'aceituna','palmitos':'palmito',
    'cebolla morada':'cebolla','cebolla caramelizada':'cebolla','cebolla crispy':'cebolla','cebolla frita':'cebolla','queso fundido':'queso','queso rallado':'queso',
    'doble queso':'queso','triple queso':'queso','tres tipos de queso fundido':'queso',
    'camarones salteados':'camarón','camarones':'camarón','choricillo parrillero':'choricillo',
    'huevos fritos':'huevo','huevo frito':'huevo','huevo duro':'huevo','papas fritas':'papa frita',
    'papas fritas gratis':'papa frita','ají verde':'ají verde','salsa de la casa':'salsa de la casa',
    'salsa bbq':'salsa BBQ','carne mechada':'carne mechada','pollo crispy':'pollo crispy',
    'pollo a la plancha':'pollo','carne picada':'carne','queso cheddar':'queso cheddar',
    'queso philadelphia':'queso Philadelphia','extra queso':'queso','extra carne':'carne','extra pollo':'pollo',
    'morrón':'pimentón','pimentón':'pimentón','champiñones':'champiñón','porotos':'poroto',
    'carnes de hamburguesa':'carne','carne de hamburguesa':'carne','choricillos':'choricillo',
    'pollo crispy':'pollo','camarones salteados':'camarón','americana':'salsa americana',
    'aros de cebolla':'cebolla','mayo al ajo':'mayonesa','mechada':'carne mechada',
}

def slug(value: str) -> str:
    import unicodedata
    value = unicodedata.normalize('NFKD', value.lower()).encode('ascii','ignore').decode()
    return re.sub(r'[^a-z0-9]+','-',value).strip('-')

def sql(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"

def price(value: str) -> int | None:
    match = re.search(r'\$\s*([\d.]+)', value)
    return int(match.group(1).replace('.','')) if match else None

def cells(line: str) -> list[str]:
    return [part.strip() for part in line.strip().strip('|').split('|')]

def clean_name(value: str) -> str:
    value = re.sub(r'\*\*|`', '', value).strip()
    return re.sub(r'\s+', ' ', value)

def ingredients_from(text: str) -> list[str]:
    text = text.lower().replace('maíz (choclo)','choclo').replace('maiz (choclo)','choclo')
    text = re.sub(r'\([^)]*\)', lambda m: ' ' + m.group(0)[1:-1] + ' ', text)
    text = text.replace('—',',').replace('$',' ')
    text = re.sub(r'\b\d+\s*(?:g|gr|kg|unidades?|filetes?|tutos?)\b', ' ', text)
    text = re.sub(r'\b(?:incluye|incluyen|sobre|a elección|base)\b', ' ', text)
    out=[]
    for part in re.split(r'[,;+]|\s+ y \s+', text):
        part = re.sub(r'\*\*|[.!`]', '', part).strip(' -')
        part = part.replace('carne / ave','carne, ave').replace('carne/ave','carne, ave')
        if ',' in part:
            for split_part in part.split(','):
                split_part=split_part.strip()
                canonical=ALIASES.get(split_part,split_part)
                if canonical and canonical not in out: out.append(canonical)
            continue
        part = re.sub(r'\b\d+\s+', '', part).strip()
        if not part or part in {'opcional','gratis','individual','normal','familiar','mediana','grande','xl','aderezo','ingrediente extra'} or re.search(r'\d{3,}',part):
            continue
        if part.startswith('maíz '): part='choclo '+part[5:]
        canonical=ALIASES.get(part,part)
        if canonical and canonical not in out: out.append(canonical)
    return out

def add_product(products, name, category, price_clp, ingredients, description='', size='', code='', product_type='dish', components=None, payment=''):
    if price_clp is None: return
    name=clean_name(name)
    ingredients=ingredients_from(ingredients)
    products.append({'name':name,'category':category,'price':price_clp,'price_min':price_clp,'price_max':price_clp,'ingredients':ingredients,
      'description':clean_name(description),'size':size,'code':code,'type':product_type,
      'components':components or [],'payment':payment})

def parse_general(text: str):
    products=[]; section=''; subsection=''
    for line in text.splitlines():
        if line.startswith('## ') and not line.startswith('### '): section=line[3:].lower(); subsection=''
        elif line.startswith('### '): subsection=line[4:].lower()
        if line.startswith('|') and not re.match(r'^\|\s*:?-{2,}',line):
            row=cells(line)
            if len(row)<3 or 'nombre' in row[0].lower() or 'cód.' in row[0].lower() or 'variedad' in row[0].lower(): continue
            label=clean_name(row[0]); desc=row[1]
            if 'hamburguesas' in section:
                add_product(products,label,'Hamburguesas',price(row[2]),desc+', papas fritas',desc,code=label)
            elif 'churrascos' in subsection:
                add_product(products,'Churrasco '+label,'Sándwiches',price(row[2]),desc+', papas fritas',desc,'Normal',label)
                if len(row)>3 and price(row[3]): add_product(products,'Churrasco '+label,'Sándwiches',price(row[3]),desc+', papas fritas',desc,'XL',label)
            elif 'mechadas' in subsection:
                add_product(products,label,'Mechadas',price(row[2]),desc+', papas fritas',desc,'Normal',label)
                if len(row)>3 and price(row[3]): add_product(products,label,'Mechadas',price(row[3]),desc+', papas fritas',desc,'XL',label)
            elif 'pepitos' in subsection:
                add_product(products,'Pepito '+label,'Pepitos',price(row[2]),desc,desc,'Normal',label)
                if len(row)>3 and price(row[3]): add_product(products,'Pepito '+label,'Pepitos',price(row[3]),desc,desc,'XL',label)
            elif 'completos' in subsection:
                cat='Completos'; display='Completo '+label
                add_product(products,display,cat,price(row[2]),desc,desc,'Normal',label)
                if len(row)>3 and price(row[3]): add_product(products,display,cat,price(row[3]),desc,desc,'XL',label)
            elif 'pizzas de la casa' in section:
                add_product(products,label,'Pizzas',price(row[2]),desc,desc,'Mediana',label)
                if len(row)>3 and price(row[3]): add_product(products,label,'Pizzas',price(row[3]),desc,desc,'Familiar',label)
        if not line.startswith('*') or 'chorrillanas' in subsection: continue
        p=price(line)
        if not p: continue
        label_match=re.search(r'\*\s*\*\*(.+?)\*\*',line)
        if not label_match: continue
        label=clean_name(label_match.group(1)).rstrip(':'); desc=line[label_match.end():].lstrip(': ')
        if 'tequeños' in subsection: category='Frituras'; label='Tequeños '+label
        elif 'chorrillanas' in subsection: category='Chorrillanas'; label='Chorrillana '+label
        elif 'fajitas' in subsection: category='Menú saludable'; label='Fajita '+label
        elif 'saludable' in section and label.upper().startswith('F'): category='Menú saludable'; label='Fajita '+label
        elif 'bowl' in label.lower(): category='Bowls'
        elif 'bebida' in label.lower() or 'jugo' in label.lower(): category='Bebidas'
        elif 'nescafé' in label.lower() or label.lower()=='té': category='Cafetería'
        elif any(k in label.lower() for k in ['papa','empanad','nugget','salchipapa']): category='Frituras'
        elif 'frituras' in subsection: category='Frituras'
        elif 'bebidas y cafetería' in section: category='Bebidas' if any(k in label.lower() for k in ['bebida','jugo']) else 'Cafetería'
        else: continue
        add_product(products,label,category,p,desc,desc,code=label)
        if label.lower()=='nescafé':
            prices=[int(x.replace('.','')) for x in re.findall(r'\$\s*([\d.]+)',desc)]
            if len(prices)>1:
                products[-1]['price']=None;products[-1]['price_min']=min(prices);products[-1]['price_max']=max(prices)
    # Items with prose rather than a markdown table.
    for name, label, raw, cat in [
      ('Chorrillana Individual','Individual','Carne, pollo, choricillo parrillero, salchicha, cebolla, huevos fritos, papas fritas','Chorrillanas'),
      ('Chorrillana para 2','Para 2 Personas','Carne, pollo, choricillo parrillero, salchicha, cebolla, huevos fritos, papas fritas','Chorrillanas'),
      ('Chorrillana para 3','Para 3 Personas','Carne, pollo, choricillo parrillero, salchicha, cebolla, huevos fritos, papas fritas','Chorrillanas'),
      ('Chorrillana Familiar','Familiar','Carne, pollo, choricillo parrillero, salchicha, cebolla, huevos fritos, papas fritas','Chorrillanas')]:
        section_text=text[text.lower().find('### chorrillanas'):text.lower().find('## 4.')]
        m=re.search(re.escape(label)+r'.{0,20}?\$([\d.]+)',section_text,re.I)
        if m:add_product(products,name,cat,int(m.group(1).replace('.','')),raw,raw)
    return products

def parse_promos(text: str):
    promos=[]; current=''; kind='seasonal'; lines=text.splitlines()
    for i,line in enumerate(lines):
        if line.startswith('### Megas Promociones'): kind='weekly'
        if line.startswith('## '): kind='seasonal'
        m=re.search(r'\*\s*\*\*(.+?)\*\*\s*(?:—|:)\s*`?\$([\d.]+)',line)
        if not m: continue
        title=clean_name(m.group(1)); amount=int(m.group(2).replace('.',''))
        extras=[]
        for child in lines[i+1:i+5]:
            if not child.strip().startswith('*'): break
            if re.search(r'\*\*.+?\*\*\s*(?:—|:)\s*`?\$',child): break
            extras.append(clean_name(child.strip('* ').replace('*','')))
        detail='; '.join(extras)
        all_text=title+' '+detail
        promo_ingredients=[]
        if 'pizza' in all_text.lower():
            promo_ingredients=['masa','salsa','queso','tomate','cebolla','pimentón','choclo','aceituna','champiñón','jamón','salame','carne','huevo','choricillo','salchicha','pollo']
        if 'pizza' in all_text.lower():
            detail=detail or 'Cada pizza incluye salsa, queso base y 3 toppings a elección.'
            if not extras: extras=['Salsa y queso base','3 toppings a elección']
            payment='Transferencia o efectivo'
        promos.append({'title':title,'price':amount,'description':detail,'kind':kind,
          'ingredients':promo_ingredients,'components':extras,
          'payment':payment if 'pizza' in all_text.lower() else ('Transferencia o efectivo' if 'transferencia' in all_text.lower() or 'exclusivo' in all_text.lower() else '')})
    return promos

def enrich_promo_ingredients(promos, products):
    burgers=[p for p in products if p['category']=='Hamburguesas']
    sandwiches=[p for p in products if p['category']=='Sándwiches']
    completos=[p for p in products if p['category']=='Completos']
    for promo in promos:
        text=(promo['title']+' '+promo['description']).lower()
        selected=[]
        if 'hamburguesas italianas' in text:
            selected += [p for p in burgers if p['name'].lower()=='italiana']
            promo['components']=['2 Hamburguesas Italianas','Papas fritas']
        elif 'churrascos italianos' in text:
            selected += [p for p in sandwiches if p['code']=='A4' and p['size']=='Normal']
            promo['components']=['2 Churrascos Italianos','Papas fritas']
        elif 'clásicos del xl' in text:
            selected += [p for p in sandwiches if p['code'] in {'A3','A4','A5'} and p['size']=='XL']
        elif '2 hamburguesas' in text:
            selected += [p for p in burgers if p['name'].lower() in {'americana','a lo pobre','italiana','chacarera'}]
        elif 'completos' in text:
            selected += completos
            promo['ingredients']=['papa frita']
        elif 'pollo' in text or 'tutitos' in text or 'filetes' in text:
            promo['ingredients']=['pollo','papa frita']
            if 'aderezo' in text or 'salsa' in text: promo['ingredients'].append('aderezo')
        for product in selected:
            promo['ingredients'].extend(product['ingredients'])
        promo['ingredients']=list(dict.fromkeys(promo['ingredients']))

def main():
    general,promo=map(lambda p:p.read_text(encoding='utf-8'),SOURCE_FILES)
    # Armable pizzas are sellable variants; the chosen toppings are selected from shared ingredients.
    products=parse_general(general)
    add_product(products,'Pizza armable','Pizzas',9000,'masa, salsa, queso','Base, salsa, queso y 3 ingredientes a elección.','Mediana','ARMABLE')
    add_product(products,'Pizza armable','Pizzas',14000,'masa, salsa, queso','Base, salsa, queso y 3 ingredientes a elección.','Familiar','ARMABLE')
    promos=parse_promos(promo)
    enrich_promo_ingredients(promos,products)
    for p in promos:
        simple_chicken=p['title'].lower().startswith(('5 tutitos','5 filetes'))
        record_type='combo' if re.search(r'\b(?:combo|2\s+(?:hamburguesas|churrascos|xl|pizzas)|los clásicos del xl)\b',p['title'].lower()) else 'promotion'
        products.append({'name':p['title'],'category':'Pollo Crispy' if simple_chicken else 'Combos','price':p['price'],'price_min':p['price'],'price_max':p['price'],'ingredients':p['ingredients'],
          'description':p['description'],'size':'','code':slug(p['title']).upper(),'type':'combo' if record_type=='combo' else 'dish',
          'components':p['components'],'payment':p['payment'],'sales_days':['Martes','Miércoles'] if p['kind']=='weekly' else []})
    # Include pizza topping options priced in the source menu by size.
    pizza_extras={'palmito':(2000,3000),'piña':(2000,3000),'tocino':(3000,4000),'camarón':(3000,4000),'queso':(3000,4000),'carne':(3000,4000),'pollo':(3000,4000)}
    ingredient_names=set()
    for item in products: ingredient_names.update(item['ingredients'])
    for item in promos: ingredient_names.update(item['ingredients'])
    categories={'Hamburguesas','Sándwiches','Mechadas','Pepitos','Completos','As','Chorrillanas','Menú saludable','Bowls','Pizzas','Bebidas','Cafetería','Frituras','Pollo Crispy','Combos','Promociones'}
    out=['-- Generated from menu_general.md and menu_y_promociones.md. Re-run scripts/build_catalog_seed.py after editing either source.',
      '-- Deterministic UUIDs and upserts make this seed safe to rerun.',
      'insert into public.categories(name,sort_order) values '+','.join(f'({sql(n)},{i})' for i,n in enumerate(sorted(categories),1))+' on conflict(name) do update set sort_order=excluded.sort_order;']
    for name in sorted(ingredient_names):
        out.append(f"insert into public.ingredients(name,normalized_name) values({sql(name)},{sql(slug(name))}) on conflict(normalized_name) do update set name=excluded.name,active=true;")
    for item in products:
        key=slug(item['category']+'-'+item['name']+'-'+item['size'])
        ident=uuid.uuid5(NAMESPACE,key)
        arr='array['+','.join(sql(x) for x in item['ingredients'])+']::text[]' if item['ingredients'] else "'{}'::text[]"
        components=json.dumps(item['components'],ensure_ascii=False,separators=(',',':'))
        limit=3 if item['code']=='ARMABLE' else 0
        days=item.get('sales_days',[]); days_sql='array['+','.join(sql(x) for x in days)+']::text[]' if days else "'{}'::text[]"
        price_sql='null' if item['price'] is None else str(item['price'])
        out.append(f"insert into public.dishes(id,name,category_id,category_name,description,ingredients,price_clp,price_min_clp,price_max_clp,image,extras,available,featured,code,size,product_type,components,payment_conditions,extra_selection_limit,sales_days) values('{ident}',{sql(item['name'])},(select id from public.categories where name={sql(item['category'])}),{sql(item['category'])},{sql(item['description'])},{arr},{price_sql},{item['price_min']},{item['price_max']},'', '[]'::jsonb,true,false,{sql(item['code'])},{sql(item['size'])},{sql(item['type'])},{sql(components)}::jsonb,{sql(item['payment'])},{limit},{days_sql}) on conflict(id) do update set name=excluded.name,category_id=excluded.category_id,category_name=excluded.category_name,description=excluded.description,ingredients=excluded.ingredients,price_clp=excluded.price_clp,price_min_clp=excluded.price_min_clp,price_max_clp=excluded.price_max_clp,code=excluded.code,size=excluded.size,product_type=excluded.product_type,components=excluded.components,payment_conditions=excluded.payment_conditions,extra_selection_limit=excluded.extra_selection_limit,sales_days=excluded.sales_days,available=true;")
        out.append(f"delete from public.dish_ingredients where dish_id='{ident}';")
        for ing in item['ingredients']:
            out.append(f"insert into public.dish_ingredients(dish_id,ingredient_id) select '{ident}',id from public.ingredients where normalized_name={sql(slug(ing))} on conflict do nothing;")
        out.append(f"delete from public.dish_extra_ingredients where dish_id='{ident}';")
        if item['category'] in {'Hamburguesas','Sándwiches','Mechadas','Pepitos','Completos'}:
            extras=['lechuga','tomate','palta','poroto verde','choclo','cebolla','champiñón','chucrut','salsa americana','pepinillo','huevo','ají verde']
            for ing in extras:
                out.append(f"insert into public.dish_extra_ingredients(dish_id,ingredient_id,price_clp) select '{ident}',id,1500 from public.ingredients where normalized_name={sql(slug(ing))} on conflict(dish_id,ingredient_id) do update set price_clp=excluded.price_clp;")
        if item['category']=='Pizzas':
            if item['code']=='ARMABLE':
                for ing in ['tomate','cebolla','pimentón','choclo','aceituna','champiñón','jamón','salame','carne','huevo','choricillo','salchicha','pollo']:
                    out.append(f"insert into public.dish_extra_ingredients(dish_id,ingredient_id,price_clp,is_included) select '{ident}',id,0,true from public.ingredients where normalized_name={sql(slug(ing))} on conflict(dish_id,ingredient_id) do update set price_clp=0,is_included=true;")
                continue
            for ing,prices in pizza_extras.items():
                tier=0 if item['size']=='Mediana' else 1
                out.append(f"insert into public.dish_extra_ingredients(dish_id,ingredient_id,price_clp) select '{ident}',id,{prices[tier]} from public.ingredients where normalized_name={sql(slug(ing))} on conflict(dish_id,ingredient_id) do update set price_clp=excluded.price_clp;")
    for item in promos:
        ident=uuid.uuid5(NAMESPACE,'promo-'+slug(item['title']))
        components=json.dumps(item['components'],ensure_ascii=False,separators=(',',':'))
        weekdays="array['Martes','Miércoles']::text[]" if 'martes' in (item['title']+' '+item['description']).lower() else "'{}'::text[]"
        record_type='combo' if re.search(r'\b(?:combo|2\s+(?:hamburguesas|churrascos|xl|pizzas)|los clásicos del xl)\b',item['title'].lower()) else 'promotion'
        out.append(f"insert into public.promotions(id,title,description,kind,price_clp,components,payment_conditions,weekdays,record_type,active) values('{ident}',{sql(item['title'])},{sql(item['description'])},{sql(item['kind'])},{item['price']},{sql(components)}::jsonb,{sql(item['payment'])},{weekdays},{sql(record_type)},true) on conflict(id) do update set description=excluded.description,kind=excluded.kind,price_clp=excluded.price_clp,components=excluded.components,payment_conditions=excluded.payment_conditions,weekdays=excluded.weekdays,record_type=excluded.record_type,active=true;")
        out.append(f"delete from public.promotion_ingredients where promotion_id='{ident}';")
        for ing in item['ingredients']:
            out.append(f"insert into public.promotion_ingredients(promotion_id,ingredient_id) select '{ident}',id from public.ingredients where normalized_name={sql(slug(ing))} on conflict do nothing;")
    # Source-listed contact/location; Instagram differs between the two files, using the general menu entry.
    out.append("update public.settings set whatsapp_number='56957603272',address='Calle 1 Norte 0115, Galería Comercial Local 6' where id=true;")
    OUT.write_text('\n'.join(out)+'\n',encoding='utf-8')
    print(f'{len(products)} catalog variants, {len(ingredient_names)} normalized ingredients, {len(promos)} promotions -> {OUT}')

if __name__=='__main__': main()
