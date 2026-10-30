import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dish } from '../data';
export type CartLine = { dish: Dish; qty: number; extras: string[]; promotion_id?: string };
type Cart = { lines: CartLine[]; add: (dish: Dish, extras?: string[], promotionId?: string) => void; qty: (id:string, extras:string[], by:number)=>void; clear:()=>void };
export const useCart = create<Cart>()(persist((set)=>({lines:[],add:(dish,extras=[],promotionId)=>set(s=>{const old=s.lines.find(l=>l.dish.id===dish.id&&l.promotion_id===promotionId&&l.extras.join('|')===extras.join('|'));return {lines:old?s.lines.map(l=>l===old?{...l,qty:l.qty+1}:l):[...s.lines,{dish,qty:1,extras,...(promotionId?{promotion_id:promotionId}:{})}]}}),qty:(id,extras,by)=>set(s=>({lines:s.lines.map(l=>l.dish.id===id&&l.extras.join('|')===extras.join('|')?{...l,qty:l.qty+by}:l).filter(l=>l.qty>0)})),clear:()=>set({lines:[]})}),{name:'h77-cart'}));
