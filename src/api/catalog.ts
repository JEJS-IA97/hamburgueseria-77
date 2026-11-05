import { extraPrice, type Dish } from '../data';
import { supabase } from '../lib/supabase';

export async function getDishes():Promise<Dish[]>{
  if(!supabase)throw new Error('Supabase no está configurado.');
  const {data,error}=await supabase.from('dishes').select('*, dish_ingredients(ingredients(name)), dish_extra_ingredients(price_clp,is_included,ingredients(name))').order('name');
  if(error)throw error;
  return (data??[]).map((d:any)=>({...d,category:d.category_name??d.category,
    ingredients:d.dish_ingredients?.length?d.dish_ingredients.map((x:any)=>x.ingredients.name):d.ingredients??[],
    extras:d.dish_extra_ingredients?.length?d.dish_extra_ingredients.map((x:any)=>({name:x.ingredients.name,price_clp:x.price_clp,is_included:x.is_included})):d.extras??[]})) as Dish[];
}

export async function getCategories(){
  if(!supabase)return [];
  const {data,error}=await supabase.from('categories').select('id,name,sort_order,active').eq('active',true).order('sort_order');
  if(error)throw error;return data??[];
}

function ingredientSlug(value:string){return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

export async function saveDish(d:Dish){
  if(!supabase)throw new Error('Configura Supabase para guardar cambios.');
  const {data:category,error:categoryError}=await supabase.from('categories').select('id').eq('name',d.category).single();
  if(categoryError)throw categoryError;
  const payload:any={...d,category_id:category.id,category_name:d.category};
  delete payload.category;delete payload.extras;
  const {error}=await supabase.from('dishes').upsert(payload);if(error)throw error;

  const names=[...new Set(d.ingredients)];
  const extras=[...new Set(d.extras.map(x=>x.name))];
  const allNames=[...new Set([...names,...extras])];
  if(allNames.length){
    const rows=allNames.map(name=>({name,normalized_name:ingredientSlug(name)}));
    const upsert=await supabase.from('ingredients').upsert(rows,{onConflict:'normalized_name'});if(upsert.error)throw upsert.error;
  }
  const ingredients=allNames.length?await supabase.from('ingredients').select('id,name').in('normalized_name',allNames.map(ingredientSlug)):{data:[],error:null};
  if(ingredients.error)throw ingredients.error;
  const byName=new Map((ingredients.data??[]).map(i=>[ingredientSlug(i.name),i.id]));
  await supabase.from('dish_ingredients').delete().eq('dish_id',d.id);
  const baseLinks=names.map(name=>({dish_id:d.id,ingredient_id:byName.get(ingredientSlug(name))})).filter(x=>x.ingredient_id);
  if(baseLinks.length){const {error}=await supabase.from('dish_ingredients').insert(baseLinks);if(error)throw error;}
  await supabase.from('dish_extra_ingredients').delete().eq('dish_id',d.id);
  const extraLinks=d.extras.map(extra=>({dish_id:d.id,ingredient_id:byName.get(ingredientSlug(extra.name)),price_clp:extraPrice(d,extra),is_included:extra.is_included??false})).filter(x=>x.ingredient_id);
  if(extraLinks.length){const {error}=await supabase.from('dish_extra_ingredients').insert(extraLinks);if(error)throw error;}
}

export async function deleteDish(id:string){if(!supabase)throw new Error('Configura Supabase para guardar cambios.');const {error}=await supabase.from('dishes').delete().eq('id',id);if(error)throw error;}
export async function uploadDishImage(file:File){if(!supabase)throw new Error('Configura Supabase para subir imágenes.');const path=`${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g,'_')}`;const {error}=await supabase.storage.from('dish-images').upload(path,file,{upsert:false,contentType:file.type});if(error)throw error;return supabase.storage.from('dish-images').getPublicUrl(path).data.publicUrl;}
