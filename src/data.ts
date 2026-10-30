export type Category=string;
export type Dish={
 id:string;name:string;category:Category;description:string;ingredients:string[];price_clp:number|null;price_min_clp?:number|null;price_max_clp?:number|null;image:string;
 extras:{name:string;price_clp:number;is_included?:boolean}[];featured?:boolean;available:boolean;size?:string;code?:string;
 product_type?:'dish'|'combo';components?:string[];payment_conditions?:string;extra_selection_limit?:number;sales_days?:string[];
};

// Solo recursos de imagen genéricos; las categorías, platos, ingredientes y precios vienen de Supabase.
export const categoryImage=(name:string)=>({
 Hamburguesas:'photo-1568901346375-23c9450c58cd',Pizzas:'photo-1579751626657-72bc17010498',Completos:'photo-1553979459-d2229ba7433b',
 As:'photo-1606755962773-d324e0a13086',Bowls:'photo-1512621776951-a57141f2eefd','Menú saludable':'photo-1547592180-85f173990554',
 Sandwiches:'photo-1606755962773-d324e0a13086',Bebidas:'photo-1513558161293-cdaf765edfd7',Combos:'photo-1550547660-d9450f859349',
 Mechadas:'photo-1606755962773-d324e0a13086',Pepitos:'photo-1553979459-d2229ba7433b',Chorrillanas:'photo-1550547660-d9450f859349',
 Frituras:'photo-1573080496219-bb080dd4f877',Cafetería:'photo-1509042239860-f550ce710b93','Pollo Crispy':'photo-1626082927389-6cd097cdc6ec',
}[name]??'photo-1550547660-d9450f859349');
export const imageUrl=(id:string,width=720)=>/^https?:\/\//.test(id)?id:id?`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`:'';
