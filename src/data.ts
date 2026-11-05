export type Category=string;
export type Dish={
 id:string;name:string;category:Category;description:string;ingredients:string[];price_clp:number|null;price_min_clp?:number|null;price_max_clp?:number|null;image:string;
 extras:{name:string;price_clp:number;is_included?:boolean}[];featured?:boolean;available:boolean;size?:string;code?:string;
 product_type?:'dish'|'combo';components?:string[];payment_conditions?:string;extra_selection_limit?:number;sales_days?:string[];
};

export const imageUrl=(id:string,width=720)=>/^https?:\/\//.test(id)?id:id?`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`:'';

const normalizeExtraLabel = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');

/** Precio vigente de cada agregado; el mismo criterio se aplica al confirmar la orden en Supabase. */
export function extraPrice(dish: Pick<Dish, 'category' | 'size' | 'code'>, extra: Pick<Dish['extras'][number], 'name' | 'is_included'>) {
  if (extra.is_included || (dish.code === 'ARMABLE' && extra.is_included == null)) return 0;
  if (normalizeExtraLabel(dish.category).includes('pizza')) {
    const name = normalizeExtraLabel(extra.name);
    const size = normalizeExtraLabel(dish.size ?? '');
    const medium = size.includes('mediana') || size.includes('mediano') || size.includes('medium');
    const large = size.includes('grande') || size.includes('familiar') || size.includes('large');
    const fruit = name.includes('palmit') || name.includes('pina');
    const premium = /tocino|camaron|queso|carne|pollo/.test(name);
    if (fruit) return large ? 3000 : medium ? 2000 : 1500;
    if (premium) return large ? 4000 : medium ? 3000 : 1500;
  }
  return 1500;
}
