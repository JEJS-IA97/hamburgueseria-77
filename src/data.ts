export type Category=string;
export type Dish={
 id:string;name:string;category:Category;description:string;ingredients:string[];price_clp:number|null;price_min_clp?:number|null;price_max_clp?:number|null;image:string;
 extras:{name:string;price_clp:number;is_included?:boolean}[];featured?:boolean;available:boolean;size?:string;code?:string;
 product_type?:'dish'|'combo';components?:string[];payment_conditions?:string;extra_selection_limit?:number;sales_days?:string[];
};

export const imageUrl=(id:string,width=720)=>/^https?:\/\//.test(id)?id:id?`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`:'';
