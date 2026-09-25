import type { FinancialModel } from './types';
export const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
export function npv(flows:number[],rate:number){if(rate<=-1) return NaN;return flows.reduce((sum,v,t)=>sum+v/Math.pow(1+rate,t),0)}
export function irr(flows:number[]):number|'multiple'|null{
 const signs=flows.filter(v=>Math.abs(v)>1e-9).map(Math.sign);let changes=0;for(let i=1;i<signs.length;i++)if(signs[i]!==signs[i-1])changes++;
 if(!changes)return null;if(changes>1)return 'multiple';
 let lo=-.9999,hi=1;while(npv(flows,lo)*npv(flows,hi)>0&&hi<1e6)hi*=2;
 if(npv(flows,lo)*npv(flows,hi)>0)return null;
 for(let i=0;i<160;i++){const mid=(lo+hi)/2;if(npv(flows,lo)*npv(flows,mid)<=0)hi=mid;else lo=mid;}return (lo+hi)/2;
}
export function payback(flows:number[],rate=0){let balance=flows[0];if(balance>=0)return 0;for(let i=1;i<flows.length;i++){const f=flows[i]/Math.pow(1+rate,i);if(balance+f>=0&&f>0)return i-1+(-balance/f);balance+=f;}return null}
export function annuity(p:number,r:number,n:number){return r===0?p/n:p*r/(1-Math.pow(1+r,-n))}
export function metrics(costs:number[],benefits:number[],rate:number){const flows=costs.map((c,i)=>(benefits[i]||0)-c);const pvCost=npv(costs,rate),pvBenefit=npv(benefits,rate),n=flows.length-1;return {flows,npv:npv(flows,rate),irr:irr(flows),bc:pvCost>0?pvBenefit/pvCost:null,caue:n>0?annuity(pvCost,rate,n):null,payback:payback(flows),discountedPayback:payback(flows,rate)}}
export function financialFlows(m:FinancialModel){const costs=[m.capex],benefits=[0];for(let y=1;y<=m.life;y++){const inflation=m.nominal?Math.pow(1+m.inflation,y):1;costs.push(m.opex*inflation);benefits.push(m.revenue*Math.pow(1+m.growth,y-1)*inflation+(y===m.life?m.residual*inflation:0));}return {costs,benefits,...metrics(costs,benefits,m.nominal?(1+m.discount)*(1+m.inflation)-1:m.discount)}}
export function hhi(shares:number[]){return shares.reduce((n,s)=>n+s*s,0)}
export function random(seed:string,key:string){let h=2166136261;for(const c of seed+'|'+key){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return (h>>>0)/4294967296}
export const money=(n:number)=>new Intl.NumberFormat('es-CO',{maximumFractionDigits:0}).format(n)+' M';
export const number=(n:number)=>new Intl.NumberFormat('es-CO',{maximumFractionDigits:0}).format(n);
