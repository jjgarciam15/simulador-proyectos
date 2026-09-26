import {validBudgetLines,budgetBasics,type BudgetLine} from './budgetLines';
import {emptyDossier,causalQuality,chainQuality,type MgaDossier} from './mga';
import type { GameState, Difficulty, Assumptions, Budget, Indicator, Activity, Outcome, Alternative } from './types';
import { scenarioById } from '../data/scenarios';
import { scoringWeights } from '../data/scoring';
import { annuity, clamp, financialFlows, hhi, metrics, npv, random } from './finance';

export const defaults:Assumptions={demand:1,capex:1,opex:1,price:1,growth:.02,inflation:.04,discount:.10,socialDiscount:.09,life:15,residual:.10,nominal:false,delay:0};
export function createGame(scenarioId:string,difficulty:Difficulty='guiado',seed='PROY-4831'):GameState {
 const s=scenarioById(scenarioId);return {mga:emptyDossier(),version:1,contentVersion:s.version,id:crypto.randomUUID(),scenarioId,seed,difficulty,phase:0,maxPhase:0,month:0,elapsed:0,cash:s.budget,committed:0,spent:0,quality:difficulty==='guiado'?40:difficulty==='profesional'?25:12,capacity:65,support:50,reputation:60,sustainability:50,studies:[],actorActions:{},nodes:['n0'],objective:'',target:s.affected,alternative:'',compared:[],budget:{operation:0,maintenance:0,environment:0,social:0,oversight:0,contingency:0},assumptions:{...defaults,life:s.regulator?10:15},loans:[],grantPending:0,grantReceived:false,policy:'none',failure:'',mitigations:[],sdgs:[],policyAligned:false,indicators:[],activities:[],journal:[],justification:'',truth:{demand:.8+random(seed,'demand')*.4,technical:.93+random(seed,'technical')*.22,environment:.8+random(seed,'environment')*.4},performance:1,extraCost:0,delay:0,pendingEvent:null,eventIds:[],snapshot:null,outcome:null,returnPhase:null,acknowledged:[]};
}
export const available=(g:GameState)=>g.cash-g.committed;
export const selected=(g:GameState)=>scenarioById(g.scenarioId).alternatives.find(a=>a.id===g.alternative);
export function coherence(g:GameState,a=selected(g)) {const s=scenarioById(g.scenarioId);const valid=g.nodes.filter(id=>s.nodes.find(n=>n.id===id)?.valid).length;const bad=g.nodes.length-valid;const tree=clamp(valid/5*100-bad*25);const obj=g.objective==='n0'?100:0;const links=a? a.causes.filter(id=>g.nodes.includes(id)).length/a.causes.length*100:0;const base=clamp(tree*.45+obj*.25+links*.3);return g.v2?base*.5+causalQuality(g)*.2+chainV2Score({...g,alternative:a?.id??g.alternative})*.3:g.contentVersion>=3?base*.7+causalQuality(g)*.15+chainQuality({...g,alternative:a?.id??g.alternative})*.15:base}
export function riskLevel(g:GameState){const s=scenarioById(g.scenarioId);return clamp(s.risks.reduce((n,r)=>n+r.probability*(g.studies.includes(r.study)?.65:1)*(g.mitigations.includes(r.id)?.5:1)*r.impact/100,0)/s.risks.length+(100-g.quality)*.15+(g.support<40?10:0))}
export function estimate(g:GameState,key:'demand'|'technical'){const id=key==='demand'?'demanda':'tecnico';return g.studies.includes(id)?1+(g.truth[key]-1)*.8:1}
export function budgetFor(g:GameState,a:Alternative){const scale=g.target/scenarioById(g.scenarioId).affected;return {operation:a.opex*scale,maintenance:a.capex*scale*.025,environment:a.capex*scale*.02,social:a.capex*scale*.015,oversight:a.capex*scale*.025,contingency:a.capex*scale*.08}}
export function technicalBudget(g:GameState,a=selected(g)){return a?a.capex*g.target/scenarioById(g.scenarioId).affected*g.assumptions.capex*estimate(g,'technical'):0}
export function projectCost(g:GameState,a=selected(g)) {if(!a)return 0;const s=scenarioById(g.scenarioId),p=s.instruments.find(p=>p.id===g.policy)!;return technicalBudget(g,a)+Object.values(g.budget).reduce((n,v)=>n+v,0)+p.admin}
export function defaultActivities(g:GameState,a=selected(g)!):Activity[]{const capex=technicalBudget(g,a);return [{id:'design',name:'Diseño y permisos',months:Math.max(1,Math.round(a.months*.2)),dependency:'',cost:capex*.1,owner:'Dirección técnica'},{id:'build',name:'Implementación de '+a.name,months:Math.max(1,Math.round(a.months*.6)),dependency:'design',cost:capex*.8,owner:'Equipo ejecutor'},{id:'operate',name:'Puesta en marcha y capacitación',months:Math.max(1,a.months-Math.round(a.months*.8)),dependency:'build',cost:capex*.1,owner:'Operador'}]}
export function allocationQuality(g:GameState){if(!g.activities.length)return 1;const capex=technicalBudget(g);const total=g.activities.reduce((n,a)=>n+a.cost,0);const delivery=clamp(total/Math.max(1,capex),0,1);const training=g.activities.find(a=>a.id==='operate');return delivery*(training?(.8+.2*clamp(training.cost/Math.max(1,capex*.1),0,1)): .85)}
export function model(g:GameState,a=selected(g),realized=false,overrides:Partial<Assumptions>={}){
 if(!a)throw new Error('Selecciona una alternativa.');
 const s=scenarioById(g.scenarioId),x={...g.assumptions,...overrides},p=s.instruments.find(p=>p.id===g.policy)!,scale=g.target/s.affected;
 const demand=x.demand*(realized?g.truth.demand:estimate(g,'demand'));const technical=estimate(g,'technical');
 const maintenanceRatio=clamp(g.budget.maintenance/Math.max(1,a.capex*scale*.025),0,1.3);
 const operationRatio=clamp(g.budget.operation/Math.max(1,a.opex*scale*x.opex),0,1);
 const reliability=clamp(1-(1-maintenanceRatio)*.25,0,1)*allocationQuality(g)*(.85+.15*operationRatio)*(realized?g.performance:1);
 const coverage=clamp(a.coverage*scale*Math.min(demand,1.2)*reliability,0,1);
 const preinvestment=g.snapshot?.decisionState?.spent??g.spent;
 const capex=a.capex*scale*x.capex*technical+g.budget.environment+g.budget.social+g.budget.oversight+p.admin+preinvestment+(realized?g.extraCost:0);
 const opex=a.opex*scale*x.opex*(1+p.compliance)+g.budget.maintenance;
 const revenue=a.revenue*scale*demand*x.price*(1+p.price)*reliability;
 const delayYears=Math.ceil((x.delay+(realized?g.delay:0))/12);
 const f=financialFlows({capex,opex,revenue,growth:x.growth,inflation:x.inflation,life:x.life,residual:a.capex*scale*x.residual,discount:x.discount,nominal:x.nominal});
 // Delayed commissioning shifts operating flows; terminal year extends accordingly.
 if(delayYears){if(x.nominal){for(let i=1;i<f.costs.length;i++){f.costs[i]*=(1+x.inflation)**delayYears;f.benefits[i]*=(1+x.inflation)**delayYears;}}f.costs.splice(1,0,...Array(delayYears).fill(0));f.benefits.splice(1,0,...Array(delayYears).fill(0));}
 const rate=x.nominal?(1+x.discount)*(1+x.inflation)-1:x.discount;
 const financial={...f,...metrics(f.costs,f.benefits,rate)};
 const benefit=a.social*scale*demand*reliability*(.65+coherence(g,a)/100*.35)*(1+p.benefit);
 const externality=(a.environment/100*a.social*.12*(1+p.externality)+(p.externality*a.social*.06))*scale*reliability;
 const ecosts=[capex*.92],ebenefits=[0];for(let y=1;y<=x.life+delayYears;y++){const operating=y>delayYears,inf=x.nominal?Math.pow(1+x.inflation,y):1;ecosts.push(operating?opex*.95*inf:0);ebenefits.push(operating?((benefit+externality)*Math.pow(1+x.growth,y-delayYears-1)+(y===x.life+delayYears?a.capex*scale*x.residual:0))*inf:0);}
 const social={costs:ecosts,benefits:ebenefits,...metrics(ecosts,ebenefits,x.nominal?(1+x.socialDiscount)*(1+x.inflation)-1:x.socialDiscount)};
 const equityFlows=[...financial.flows];for(const loan of g.loans){equityFlows[0]+=loan.principal;
  if(loan.type==='socio'){for(let y=1;y<equityFlows.length;y++)equityFlows[y]-=Math.max(0,financial.flows[y])*loan.rate;continue;}
  let balance=loan.principal;const payment=annuity(loan.principal,loan.rate,loan.years);
  for(let y=1;y<equityFlows.length&&balance>1e-8;y++){const interest=balance*loan.rate;const paid=y<=loan.years?payment:0;balance=Math.max(0,balance+interest-paid);const terminal=y===equityFlows.length-1?balance:0;equityFlows[y]-=(paid+terminal)/(x.nominal?1:(1+x.inflation)**y);if(terminal)balance=0;}
 }
 const rows=financial.flows.map((v,y)=>({year:y,financial:v,social:social.flows[y]||0,cost:financial.costs[y],benefit:financial.benefits[y],equity:equityFlows[y]}));
 return {financial,social,rows,coverage,capex,opex,revenue,benefit,equity:npv(equityFlows,rate),breakEven:revenue>0?opex/revenue:null,minimumPrice:revenue>0?opex/revenue*x.price:null,maxOpex:revenue,maintenanceRatio};
}
export function welfare(g:GameState,policyId=g.policy){const s=scenarioById(g.scenarioId),p=s.instruments.find(p=>p.id===policyId)!;const price=80*(1+p.price),quantity=Math.max(0,Math.min((s.demandIntercept-price)/.6,(price-s.supplyIntercept)/.6));const consumer=Math.max(0,(s.demandIntercept-price)*quantity-.3*quantity**2),producer=Math.max(0,(price-s.supplyIntercept)*quantity-.3*quantity**2),external=quantity*s.externalCost*(1-p.externality),admin=p.admin/20,compliance=quantity*p.compliance*20,total=consumer+producer-external-admin-compliance;const shares=p.entry>0?s.market.map(v=>v*.85).concat(15):p.entry<0?[s.market[0]+s.market.at(-1)!,...s.market.slice(1,-1)]:s.market;const optimalQ=(s.demandIntercept-s.supplyIntercept-s.externalCost)/1.2;const optimum=(s.demandIntercept-s.supplyIntercept-s.externalCost)*optimalQ-.6*optimalQ*optimalQ;return {price,quantity,consumer,producer,external,admin,compliance,total,dwl:Math.max(0,optimum-total),shares,hhi:hhi(shares)}}
export type Action=ActionV2 | ActionV22 | QuestionAction | NegotiationAction | { type: 'stageTime'; phase: number; seconds: number }
 |{type:'learn';id:string;choice:string;confidence:'seguro'|'duda'}
 |{type:'reflection';text:string}
 |{type:'mga';section:'links'|'chain'|'prediction';value:MgaDossier}
 |{type:'study';id:string}|{type:'actor';id:string;choice:string}|{type:'nodes';ids:string[]}|{type:'objective';id:string}|{type:'target';value:number}|{type:'alternative';id:string}|{type:'compare';ids:string[]}|{type:'budget';value:Budget;lines?:BudgetLine[]}|{type:'assumptions';value:Assumptions}|{type:'finance';source:'credito'|'cofinanciacion'|'socio'}|{type:'policy';id:string;failure:string}|{type:'mitigate';id:string}|{type:'alignment';sdgs:number[];policy:boolean}|{type:'indicators';value:Indicator[]}|{type:'activities';value:Activity[]}|{type:'justify';text:string}|{type:'ack';id:string}|{type:'next'}|{type:'reopen';phase:number}|{type:'commit';text?:string}|{type:'advance'}|{type:'respond';choice:'continuar'|'mitigar'|'redimensionar'|'aplazar'|'tecnologia'|'renegociar'|'abandonar'}|{type:'abandon'}|{type:'waitGrant'};
function record(g:GameState,title:string,detail:string,cost=0,time=0){g.journal.push({id:g.journal.length+1,month:g.month,phase:g.phase,title,detail,cost,time});}
function spend(g:GameState,cost:number){if(!Number.isFinite(cost)||cost<0)throw new Error('Costo inválido.');if(cost>available(g)+.001)throw new Error('Saldo insuficiente. Ajusta el alcance o consigue financiación.');g.cash-=cost;g.spent+=cost;}
function advanceTime(g:GameState,months:number){g.month+=months;if(g.grantPending&&g.month>=g.grantPending){const amount=scenarioById(g.scenarioId).budget*.2;g.cash+=amount;g.grantPending=0;g.grantReceived=true;record(g,'Cofinanciación desembolsada','Se recibió el aporte condicionado al plan de cobertura.',0,0);}}
export function validatePhase(g:GameState):string|null{
 if(g.contentVersion>=3&&g.phase===0&&(g.mga?.links.length??0)<4)return 'En el laboratorio MGA, conecta cuatro relaciones causales y confirma el mapa.';
 if(!g.v2&&g.contentVersion>=3&&g.phase===2&&(!g.mga?.chain.cause||!g.mga.chain.objective||!g.mga.chain.product||g.mga.chain.activities.length<2))return 'Completa y confirma la cadena de valor en el laboratorio MGA.';
 if(g.phase===0&&(g.nodes.length<4||!g.nodes.some(id=>scenarioById(g.scenarioId).nodes.find(n=>n.id===id)?.level==='direct')))return 'Construye el Árbol del problema con una causa directa, causas indirectas y efectos (al menos cuatro nodos).';
 if(g.phase===1&&(!g.alternative||!g.objective))return 'Selecciona un objetivo central y una alternativa.';
 if(g.phase===2){if(!g.indicators.length)return 'Define al menos un indicador con línea base y meta.';if(g.activities.length<2)return 'Prepara al menos dos actividades y sus dependencias.';if(projectCost(g)>available(g))return 'El presupuesto propuesto supera el saldo disponible. Ajusta o financia antes de avanzar.';}
 if(g.phase===3&&!g.acknowledged.includes('evaluation'))return 'Revisa los flujos y confirma que analizaste los supuestos.';
 if(g.phase===4&&!g.failure)return 'Identifica la falla de mercado o justifica no intervenir.';
 return null;
}
function coreAct(original:GameState,action:Action,withComparison=true):GameState{
 if(action.type==='learn')return recordLearning(original,action.id,action.choice,action.confidence);
 const g=structuredClone(original),s=scenarioById(g.scenarioId);
 if(action.type==='reflection'){if(!g.outcome)throw new Error('La reflexión final se registra al cerrar la misión.');g.mga={...(g.mga??emptyDossier()),reflection:action.text.slice(0,2000)};return g;}
 if(g.outcome)throw new Error('Esta partida ya terminó. Puedes repetirla o explorar otra estrategia.');
 if(g.snapshot&&!['advance','respond','finance','abandon'].includes(action.type))throw new Error('La inversión está comprometida. Utiliza las respuestas de ejecución.');
 if(g.pendingEvent&&!['respond','finance','abandon'].includes(action.type))throw new Error('Resuelve el evento antes de continuar.');
 const stages:Partial<Record<Action['type'],number[]>>={actor:[0],nodes:[0],target:[0],objective:[1],alternative:[1],compare:[1],budget:[2],indicators:[2],activities:[2],assumptions:[3],ack:[3],policy:[4],alignment:[4],mitigate:[4,5],justify:[5],waitGrant:[2,5]};
 if(stages[action.type]&&!stages[action.type]!.includes(g.phase))throw new Error('Esta decisión corresponde a otra etapa. Reabre esa etapa para modificarla.');
 switch(action.type){
 case 'mga':{const required={links:0,chain:2,prediction:3}[action.section];if(g.phase!==required)throw new Error('Reabre la etapa correspondiente para modificar el expediente.');const value=action.value;const dossier=g.mga??emptyDossier();if(action.section==='links'){if(value.links.length>8||new Set(value.links.map(l=>l.from+'>'+l.to)).size!==value.links.length||value.links.some(l=>l.from===l.to||!g.nodes.includes(l.from)||!g.nodes.includes(l.to)))throw new Error('Conecta nodos seleccionados, sin duplicados ni enlaces a sí mismos.');dossier.links=value.links;}if(action.section==='chain'){const c=value.chain;if(!s.nodes.some(n=>n.id===c.cause)||!s.nodes.some(n=>n.id===c.objective)||!['service','activity','population'].includes(c.product)||new Set(c.activities).size!==c.activities.length||c.activities.some(id=>!g.activities.some(a=>a.id===id)))throw new Error('Selecciona elementos existentes de la cadena de valor.');dossier.chain=c;}if(action.section==='prediction'){dossier.prediction=value.prediction.slice(0,1200);dossier.assumption=value.assumption.slice(0,1200);}g.mga=dossier;g.acknowledged=[];record(g,'Expediente MGA actualizado',action.section==='links'?'Relaciones causales registradas.':action.section==='chain'?'Vínculos de la cadena de valor registrados.':'Hipótesis y supuesto externo registrados, sin calificación del texto.');break;}
 case 'study':{if(g.phase!==0&&!(g.v2&&g.phase<=5))throw new Error('Los estudios se contratan en diagnóstico.');const study=s.studies.find(v=>v.id===action.id);if(!study||g.studies.includes(study.id))throw new Error('Estudio no disponible o ya realizado.');spend(g,study.cost);advanceTime(g,study.months);g.studies.push(study.id);g.quality=clamp(g.quality+study.quality);record(g,study.name,study.finding,study.cost,study.months);break;}
 case 'actor':{if(g.actorActions[action.id])throw new Error('Este actor ya recibió una intervención.');if(!s.actors.some(a=>a.id===action.id))throw new Error('Actor desconocido.');const choices:Record<string,[number,number,number,number]>={consultar:[.003,1,7,4],negociar:[.008,2,12,5],informar:[.001,0,3,1],involucrar:[.012,3,16,8],monitorear:[.0005,0,1,1],ignorar:[0,0,-8,-5]};const configured=choices[action.choice],actor=s.actors.find(a=>a.id===action.id)!;const c=configured?[...configured]:undefined;if(c&&g.v2){const multiplier=.5+actor.power/100;c[2]=Math.round(c[2]*multiplier);c[3]=Math.round(c[3]*(.5+actor.interest/100));}if(!c)throw new Error('Acción inválida.');spend(g,s.budget*c[0]);advanceTime(g,c[1]);g.support=clamp(g.support+c[2]);g.reputation=clamp(g.reputation+c[3]);g.actorActions[action.id]=action.choice;record(g,action.choice+' · '+s.actors.find(a=>a.id===action.id)!.name,'Apoyo '+(c[2]>=0?'+':'')+c[2]+'; legitimidad '+c[3],s.budget*c[0],c[1]);break;}
 case 'nodes':g.nodes=[...new Set(['n0',...action.ids.filter(id=>s.nodes.some(n=>n.id===id))])];record(g,'Árbol del problema actualizado','La coherencia se evaluará a partir de las relaciones causales.');break;
 case 'objective':if(!s.nodes.some(n=>n.id===action.id))throw new Error('Objetivo inválido.');g.objective=action.id;record(g,'Objetivo central definido',s.nodes.find(n=>n.id===action.id)!.objective);break;
 case 'target':if(!Number.isFinite(action.value)||action.value<s.affected*.25||action.value>s.affected)throw new Error('La focalización debe estar entre 25 % y 100 % de la población afectada.');g.target=Math.round(action.value);record(g,'Población objetivo definida',g.target+' personas priorizadas; los beneficiarios efectivos dependen de la alternativa.');break;
 case 'alternative':{const a=s.alternatives.find(a=>a.id===action.id);if(!a)throw new Error('Alternativa inválida.');g.alternative=a.id;if(!g.v2){g.budget=budgetFor(g,a);g.activities=[];}g.assumptions.life=a.life;g.sustainability=clamp(50+a.environment*.5);g.capacity=clamp(90-a.complexity*.45);g.acknowledged=[];record(g,'Alternativa propuesta: '+a.name,a.tradeoff);break;}
 case 'compare':g.compared=action.ids.filter(id=>s.alternatives.some(a=>a.id===id)).slice(0,3);break;
 case 'budget':if(Object.values(action.value).some(v=>!Number.isFinite(v)||v<0))throw new Error('El presupuesto requiere valores no negativos.');g.budget=action.value;g.acknowledged=[];record(g,'Presupuesto actualizado','Operación, mantenimiento, gestión y contingencias revisados.');break;
 case 'assumptions':{const x=action.value;if(Object.values(x).some(v=>typeof v==='number'&&!Number.isFinite(v))||x.discount<0||x.socialDiscount<0||x.life<1||x.life>40||x.demand<.1||x.capex<.1||x.opex<.1||x.price<.1||x.growth<=-1||x.inflation<0||x.delay<0||x.residual<0||x.residual>1)throw new Error('Supuestos fuera de rango.');g.assumptions=x;g.acknowledged=[];record(g,'Supuestos confirmados','Se recalcularon evaluación y necesidades presupuestales.');break;}
 case 'finance':{if(action.source==='cofinanciacion'){if(s.role==='privado')throw new Error('Esta fuente no está habilitada para el escenario privado.');if(g.grantPending||g.grantReceived)throw new Error('El aporte ya fue solicitado.');if(g.support<60||g.target<s.affected*.7)throw new Error('La cofinanciación exige apoyo ≥ 60 y focalizar al menos 70 % de la población afectada.');g.grantPending=g.month+4;record(g,'Cofinanciación solicitada','Aporte de 20 % del presupuesto en cuatro meses; obliga a mantener el alcance.');}else{if(g.loans.some(l=>l.type===action.source))throw new Error('Esta línea ya fue utilizada.');if(action.source==='socio'&&s.role!=='privado')throw new Error('El socio inversor está disponible en la planta privada.');const principal=s.budget*(action.source==='credito'?.35:.25);g.cash+=principal;g.loans.push({principal,rate:action.source==='credito'?.12:.25,years:5,type:action.source});record(g,action.source==='credito'?'Crédito contratado':'Socio incorporado',action.source==='credito'?'35 % del presupuesto; 12 % efectivo anual, cinco cuotas anuales.':'25 % del presupuesto a cambio de 25 % del flujo positivo durante la vida del proyecto.');}break;}
 case 'policy':if(!s.instruments.some(p=>p.id===action.id))throw new Error('Instrumento inválido.');g.policy=action.id;g.failure=action.failure;g.acknowledged=[];record(g,'Decisión regulatoria',s.instruments.find(p=>p.id===action.id)!.name+' · '+action.failure);break;
 case 'mitigate':{const r=s.risks.find(r=>r.id===action.id);if(!r||g.mitigations.includes(r.id))throw new Error('Mitigación ya aplicada o inválida.');spend(g,r.cost);g.mitigations.push(r.id);record(g,'Mitigación: '+r.name,r.mitigation,r.cost);break;}
 case 'alignment':g.sdgs=[...new Set(action.sdgs.filter(id=>id>=1&&id<=17))];g.policyAligned=action.policy;record(g,'Alineación estratégica revisada','La contribución se deriva de productos e impactos, no de seleccionar casillas.');break;
 case 'indicators':if(action.value.some(i=>!i.name.trim()||!i.unit.trim()||!i.source.trim()||!i.owner.trim()||!Number.isFinite(i.baseline)||!Number.isFinite(i.target)))throw new Error('Completa nombre, unidad, fuente, responsable y valores del indicador.');g.indicators=action.value;record(g,'Indicadores definidos',action.value.length+' indicadores de seguimiento.');break;
 case 'activities':{const ids=action.value.map(a=>a.id);if(action.value.some((a,i)=>!a.name.trim()||!a.owner.trim()||!Number.isFinite(a.months)||a.months<1||!Number.isFinite(a.cost)||a.cost<0||(a.dependency&&!ids.slice(0,i).includes(a.dependency))))throw new Error('Las actividades requieren duración positiva y dependencias anteriores, sin ciclos.');g.activities=action.value;record(g,'Cronograma confirmado',action.value.length+' actividades con dependencias.');break;}
 case 'justify':g.justification=action.text.slice(0,1200);break;
 case 'ack':if(!g.acknowledged.includes(action.id))g.acknowledged.push(action.id);break;
 case 'reopen':{if(action.phase>=g.phase||action.phase<0)throw new Error('Solo puedes reabrir una etapa anterior.');const fee=s.budget*.002;spend(g,fee);advanceTime(g,1);g.phase=action.phase;g.acknowledged=[];record(g,'Reformulación iniciada','Reabrir consume un mes y 0,2 % del presupuesto inicial.',fee,1);break;}
 case 'waitGrant':{if(!g.grantPending)throw new Error('No existe un desembolso pendiente.');advanceTime(g,1);record(g,'Espera de cofinanciación','Se consumió un mes del plazo disponible.',0,1);break;}
 case 'next':{if(g.phase>=5)throw new Error('Confirma la inversión para iniciar ejecución.');const error=validatePhase(g);if(error)throw new Error(error);const time=g.returnPhase===5||g.v2?.completed.includes(g.phase)?0:1;advanceTime(g,time);record(g,'Etapa completada',time?'Decisiones guardadas; un mes de trabajo de formulación.':'Revisión contrafactual: se conserva la fecha original de decisión.',0,time);g.phase++;g.maxPhase=Math.max(g.maxPhase,g.phase);break;}
 case 'commit':{if(g.phase!==5||!selected(g))throw new Error('Completa las etapas antes de comprometer inversión.');if(g.target<s.affected*.7&&(g.grantPending||g.grantReceived))throw new Error('El alcance incumple la condición de cofinanciación.');const cost=projectCost(g);if(cost>available(g))throw new Error('La inversión supera los recursos disponibles.');if(!g.indicators.length||g.activities.length<2)throw new Error('Completa indicadores y cronograma.');const allocation=g.activities.reduce((n,a)=>n+a.cost,0);if(allocation>technicalBudget(g)+.01)throw new Error('Las actividades asignan más dinero que la inversión técnica. Revisa su presupuesto.');if(action.text!==undefined)g.justification=action.text.slice(0,1200);const m=model(g);const decisionState=structuredClone(g);g.snapshot={alternative:g.alternative,assumptions:structuredClone(g.assumptions),budget:structuredClone(g.budget),policy:g.policy,causes:[...g.nodes],objective:g.objective,target:g.target,available:available(g),month:g.month,quality:g.quality,support:g.support,coherence:coherence(g),expectedFinancial:m.financial.npv,expectedSocial:m.social.npv,loans:structuredClone(g.loans),mitigations:[...g.mitigations],sdgs:[...g.sdgs],policyAligned:g.policyAligned,activities:structuredClone(g.activities),indicators:structuredClone(g.indicators),decisionState};g.committed=cost;record(g,'Inversión comprometida',selected(g)!.name+' · Se congeló la evaluación ex ante.');g.journal.at(-1)!.justification=g.justification;g.phase=6;g.maxPhase=6;break;}
 case 'advance':{if(g.phase!==6)throw new Error('La ejecución aún no inicia.');const a=selected(g)!;if(!g.eventIds.includes('technical-reveal')){g.eventIds.push('technical-reveal');const delta=g.truth.technical-estimate(g,'technical');if(delta>.005){g.pendingEvent={id:'technical-reveal',name:'El diseño definitivo precisa los costos',description:'La revisión de ingeniería revela costos que no estaban completamente identificados al decidir.',category:'technical',probability:1,cost:delta,delay:0,benefit:0,study:'tecnico'};record(g,'Revelación de información técnica',g.pendingEvent.description);break;}}
 const planned=Math.max(a.months,schedule(g.activities).duration)+g.assumptions.delay;const step=Math.min(3,Math.max(1,planned+g.delay-g.elapsed));const remaining=Math.max(1,planned+g.delay-g.elapsed);const protectedReserve=g.budget.operation+g.budget.maintenance+g.budget.contingency;const release=Math.max(0,g.committed-protectedReserve)*Math.min(1,step/remaining);g.committed-=release;g.cash-=release;g.spent+=release;g.elapsed+=step;advanceTime(g,step);record(g,'Ejecución · mes '+g.elapsed,'Desembolso de actividades programadas; las reservas siguen protegidas.',release,step);
 const period=Math.floor(g.elapsed/3),event=s.events.find(e=>(e.minVersion??1)<=g.contentVersion&&!g.eventIds.includes(e.id)&&random(g.seed,'event:'+period+':'+e.id)<e.probability*(g.v2?difficultyRules[g.difficulty].event*(1+(g.v2.eventRisk??0)):g.difficulty==='experto'?1.25:.8)*(1.3-g.quality*.006)*(g.studies.includes(e.study)?.5:1)*(e.category==='social'?1.4-g.support/100:1)*(e.category==='environment'?g.truth.environment:1)*(g.mitigations.some(id=>s.risks.find(r=>r.id===id)?.study===e.study)?.5:1));
 if(event){g.pendingEvent={...event};g.eventIds.push(event.id);record(g,'Evento: '+event.name,event.description);}else if(g.elapsed>=planned+g.delay)finish(g,g.month>s.deadline?'incumplimiento':'completado',withComparison);break;}
 case 'respond':{const e=g.pendingEvent;if(!e)throw new Error('No hay evento pendiente.');if(action.choice==='abandonar'){finish(g,'abandonado',withComparison);break;}const a=selected(g)!;const base=a.capex*(g.target/s.affected)*g.assumptions.capex;const severity=e.id==='technical-reveal'?1:g.difficulty==='experto'?1.25:1;let cost=base*e.cost*severity,delay=e.delay,benefit=e.benefit;
 if(action.choice==='mitigar'){cost*=.7;delay=Math.ceil(delay*.4);benefit*=.3;}
 if(action.choice==='redimensionar'){cost*=.15;benefit-=.10;g.support=clamp(g.support-6);}
 if(action.choice==='aplazar'){cost*=.65;delay+=3;benefit-=.03;}
 if(action.choice==='tecnologia'){cost+=base*.025;benefit+=.06;delay+=1;}
 if(action.choice==='renegociar'){cost*=.5;delay+=2;g.support=clamp(g.support-3);}
 // Reallocate reserved contingency before seeking uncommitted cash; never spend twice.
 const contingency=Math.min(g.budget.contingency,g.committed,cost);g.committed-=contingency;g.budget.contingency-=contingency;
 spend(g,cost);g.extraCost+=cost;g.delay+=delay;g.performance=clamp(g.performance+benefit,0,1.3);g.support=clamp(g.support+(action.choice==='mitigar'?2:0));g.reputation=clamp(g.reputation+(action.choice==='redimensionar'?-3:action.choice==='mitigar'?2:0));g.sustainability=clamp(g.sustainability+(action.choice==='tecnologia'?5:0));record(g,'Respuesta: '+action.choice,`Evento ${e.id}. Costo ${Math.round(cost)} M; retraso ${delay} meses; cambio de desempeño ${Math.round(benefit*100)} %.`,cost);g.pendingEvent=null;
 const planned=Math.max(a.months,schedule(g.activities).duration)+g.assumptions.delay;
 if(g.elapsed>=planned+g.delay)finish(g,g.month>s.deadline?'incumplimiento':'completado',withComparison);break;}
 case 'abandon':finish(g,g.snapshot&&available(g)<s.budget*.01?'insolvencia':'abandonado',withComparison);break;
 }
 if(!g.outcome&&g.month>s.deadline+24)finish(g,'incumplimiento',withComparison);
 if(g.cash<-.01||g.committed<-.01||available(g)<-.01)throw new Error('La operación viola el presupuesto.');return g;
}
export function schedule(activities:Activity[]){const ends:Record<string,number>={};const rows=activities.map(a=>{const start=a.dependency?ends[a.dependency]||0:0;ends[a.id]=start+a.months;return {...a,start,end:ends[a.id]}});return {rows,duration:Math.max(0,...Object.values(ends))}}
export function indicatorValue(g:GameState,indicator:Indicator,progress=1){const m=model(g,selected(g),true);switch(indicator.measure??'coverage'){case 'coverage':return scenarioById(g.scenarioId).affected*m.coverage*progress;case 'progress':return progress*100;case 'spending':return g.spent;case 'benefit':return m.benefit*progress;}}
export function sdgImpact(g:GameState,id:number,realized=true){const a=selected(g);if(!a)return 0;return clamp((a.sdg[id]??0)*model(g,a,realized).coverage*coherence(g,a)/100,-2,2)}
function finish(g:GameState,status:Outcome['status'],withComparison=true){
 const s=scenarioById(g.scenarioId);if(!g.alternative){g.alternative=s.alternatives[0].id;g.budget=budgetFor(g,s.alternatives[0]);}
 if(status==='abandonado'||status==='insolvencia')g.performance=0;
 const unused=g.committed;g.committed=0;g.phase=7;g.maxPhase=7;
 const m=model(g,selected(g),true),snapshot=g.snapshot;
 if(status==='abandonado'||status==='insolvencia'){m.financial.npv=-g.spent;m.social.npv=-g.spent*.92;m.equity=-g.spent;m.coverage=0;}
 const indicatorCoherent=g.indicators.some(i=>(i.kind==='Resultado'&&(i.measure??'coverage')==='coverage')||(i.kind==='Impacto'&&i.measure==='benefit'));
 const dimensions=[{name:'Coherencia y estrategia',value:coherence(g),weight:.20},{name:s.role==='publico'?'Bienestar social':'Creación de valor',value:clamp(50+(s.role==='publico'?m.social.npv:m.equity)/s.budget*30),weight:.20},{name:'Cobertura y equidad',value:clamp(m.coverage*100*.65+selected(g)!.equity*.35),weight:.15},{name:'Información y riesgo',value:clamp(g.quality*.5+(100-riskLevel(g))*.5),weight:.10},{name:'Sostenibilidad y alineación',value:clamp(50+selected(g)!.environment*.4+(g.sdgs.filter(id=>s.sdgs.includes(id)).length-g.sdgs.filter(id=>!s.sdgs.includes(id)).length*2)*4+(g.policyAligned?(coherence(g)>60?8:-15):0)),weight:.10},{name:'Disciplina financiera',value:clamp(100-g.extraCost/s.budget*150-g.loans.reduce((n,l)=>n+l.principal,0)/s.budget*15),weight:.10},{name:'Plazo y resiliencia',value:clamp(100-Math.max(0,g.month-s.deadline)*4),weight:.10},{name:'Legitimidad y cumplimiento',value:clamp(g.support*.6+g.reputation*.4-(g.policy!=='none'&&g.failure!==s.failure?20:0)),weight:.05}];
 dimensions.forEach((d,i)=>d.weight=scoringWeights[s.role][i]);
 const positiveImpact=s.sdgs.reduce((sum,id)=>sum+sdgImpact(g,id),0)/s.sdgs.length;
 dimensions[4].value=clamp(50+positiveImpact*20-(g.sdgs.filter(id=>!s.sdgs.includes(id)).length*8)+(g.policyAligned?(indicatorCoherent&&coherence(g)>60?8:-15):0));
 const chosenExpected=s.role==='publico'?(snapshot?.expectedSocial??model(g).social.npv):(snapshot?.expectedFinancial??model(g).financial.npv);
 const chosenRealized=s.role==='publico'?m.social.npv:m.financial.npv;
 const results=withComparison&&snapshot?compareStrategies(g):[{name:selected(g)!.name,expected:chosenExpected,realized:chosenRealized,feasible:!!snapshot&&projectCost(snapshot.decisionState!)<=snapshot.available&&snapshot.month+Math.max(selected(g)!.months,schedule(g.activities).duration)+g.assumptions.delay<=s.deadline}];
 const chosen=results.find(a=>a.name===selected(g)!.name)!;chosen.realized=chosenRealized;chosen.expected=chosenExpected;
 const feasible=results.filter(a=>a.feasible);const best=feasible.length?feasible.reduce((b,a)=>a.realized>b.realized?a:b):null,expectedBest=feasible.length?feasible.reduce((b,a)=>a.expected>b.expected?a:b):null;
 const lessons:string[]=[];if(g.quality<60)lessons.push('La información limitada dejó mayor exposición a desviaciones; compara el costo de un estudio con la pérdida que podría evitar.');if(m.maintenanceRatio<.8)lessons.push('El mantenimiento insuficiente redujo confiabilidad y cobertura durante la operación.');if(coherence(g)<65)lessons.push('La cadena causal presentó vacíos: revisa si los productos actúan sobre las causas elegidas.');if(g.support<50)lessons.push('La baja participación debilitó legitimidad y aumentó exposición social.');if(m.financial.npv<0&&m.social.npv>0)lessons.push('El beneficio social positivo no financia por sí mismo el déficit de caja: se necesita una fuente sostenible.');if(g.extraCost>0)lessons.push('Los eventos consumieron recursos: las contingencias y la mitigación deben evaluarse antes de comprometer la inversión.');if(!lessons.length)lessons.push('La estrategia mantuvo consistencia y recursos. Prueba otra focalización para explorar el costo de oportunidad.');
 if(!snapshot)lessons.push('El proyecto se cerró antes de comprometer inversión. No existe una comparación contrafactual de ejecución.');
 g.outcome={status,score:Math.round(clamp(dimensions.reduce((n,d)=>n+d.value*d.weight,0)*(status==='abandonado'||status==='insolvencia'?.35:1))),dimensions,financial:m.financial.npv,social:m.social.npv,coverage:m.coverage,expectedFinancial:snapshot?.expectedFinancial??model(g).financial.npv,expectedSocial:snapshot?.expectedSocial??model(g).social.npv,opportunity:best?Math.max(0,best.realized-chosen.realized):0,expectedOpportunity:expectedBest?Math.max(0,expectedBest.expected-chosen.expected):0,best:best?.name??'No hay alternativa factible bajo estas restricciones',alternatives:results,wasted:status==='abandonado'||status==='insolvencia'?g.spent:g.extraCost,lessons};
 if(g.v2){const assessment=scoreV2(g,g.outcome.dimensions);g.outcome.assessment=assessment;g.outcome.dimensions=assessment.dimensions;g.outcome.score=Math.round(clamp(assessment.base-assessment.penalty+(assessment.bonus??0))*(status==='abandonado'||status==='insolvencia'?.35:1));g.outcome.lessons.push(assessment.story);}
 record(g,'Evaluación ex post',`Cierre: ${status}. Compromisos liberados: ${Math.round(unused)} M.`);
}
/** Replay each candidate with the same seed and response policy, never with a new random draw. */
function compareStrategies(g:GameState){const s=scenarioById(g.scenarioId),snapshot=g.snapshot!,base=snapshot.decisionState!;return s.alternatives.map(a=>{
 let counter=structuredClone(base);counter.alternative=a.id;const ratio=a.months/selected(base)!.months,costRatio=technicalBudget(counter,a)/Math.max(1,technicalBudget(base));counter.activities=base.activities.map(activity=>({...activity,months:Math.max(1,Math.round(activity.months*ratio)),cost:activity.cost*costRatio}));
 const expected=model(counter,a);const feasible=projectCost(counter)<=snapshot.available&&counter.month+Math.max(a.months,schedule(counter.activities).duration)+counter.assumptions.delay<=s.deadline;
 let realized=s.role==='publico'?model(counter,a,true).social.npv:model(counter,a,true).financial.npv;
 if(feasible){counter=act(counter,{type:'commit'},false);for(let i=0;i<100&&!counter.outcome;i++){
  if(counter.pendingEvent){const eventId=counter.pendingEvent.id;const prior=g.journal.find(d=>d.title.startsWith('Respuesta: ')&&d.detail.startsWith('Evento '+eventId+'.'));const choice=(prior?.title.slice('Respuesta: '.length)??'continuar') as Extract<Action,{type:'respond'}>['choice'];
   try{counter=act(counter,{type:'respond',choice},false)}catch{const canBorrow=!counter.loans.some(l=>l.type==='credito')&&g.loans.some(l=>l.type==='credito');counter=act(counter,canBorrow?{type:'finance',source:'credito'}:{type:'abandon'},false);}
  }else counter=act(counter,{type:'advance'},false);
 }realized=counter.outcome?(s.role==='publico'?counter.outcome.social:counter.outcome.financial):realized;}
 return {name:a.name,expected:s.role==='publico'?expected.social.npv:expected.financial.npv,realized,feasible};
})}
export function forkDecision(g:GameState):GameState{if(!g.snapshot?.decisionState)throw new Error('No existe una decisión de inversión para explorar.');const copy=structuredClone(g.snapshot.decisionState);copy.id=crypto.randomUUID();copy.phase=1;copy.maxPhase=5;copy.returnPhase=5;copy.outcome=null;copy.snapshot=null;copy.acknowledged=[];record(copy,'Exploración de otra estrategia','Mismas condiciones externas, fecha y recursos previos a inversión.');return copy;}

import {recordLearning} from './learning';
import {newV2State,invalidateV2,chainV2Score} from './projectV2';
import {applyV2,type ActionV2} from './actionsV2';
import {difficultyRules} from '../data/balance';

export function createGameV2(id:string,d:Difficulty='guiado',seed='PROY-4831',mode:'aprendizaje'|'evaluacion'='aprendizaje'){const g=createGame(id,d,seed);g.v2=newV2State(g);g.v2.v22={version:1,mode};g.cash=g.v2.initialCash;return g;}
const v2Actions=['visit','chain','actorMap','sdgReasons','regulatory','planner','resetStage','tree'];
const v22Actions=['objectives','impacts','valuation','flow','economic','committee'];
const dependencyFields:Record<string,keyof GameState>={nodes:'nodes',target:'target',objective:'objective',alternative:'alternative',budget:'budget',activities:'activities',indicators:'indicators',assumptions:'assumptions',policy:'policy',alignment:'sdgs',study:'studies',actor:'actorActions',mitigate:'mitigations',mga:'mga'};
export function act(original:GameState,action:Action,withComparison=true):GameState{
 if(action.type==='stageTime'){/* Local analytics only: time spent per stage, never used for scoring. */if(!original.v2||!Number.isFinite(action.seconds)||action.seconds<=0||action.phase<0||action.phase>7)return original;const next=structuredClone(original);const t=next.v2!.stageSeconds??{};t[action.phase]=Math.round((t[action.phase]??0)+Math.min(action.seconds,3600));next.v2!.stageSeconds=t;return next;}
 if(original.v2?.challenge?.noCredit&&action.type==='finance'&&action.source==='credito')throw new Error('Este reto no permite contratar crédito. Revisa el alcance, el presupuesto o los requisitos de cofinanciación.');
 if(original.v2&&action.type==='budget'&&!validBudgetLines(action.lines??original.v2.budgetLines??[],action.value))throw new Error('Revisa cantidades, unidades y costos: el detalle no puede superar la asignación de su categoría.');
 if(action.type==='answerV2'||action.type==='hintV2')return assessQuestion(original,action);
 if(action.type==='dilemma')return resolveDilemma(original,action.choice);
 if(original.v2?.pendingDilemma&&(action.type==='next'||action.type==='commit'))throw new Error('Resuelve el dilema pendiente antes de continuar: '+dilemmaById(original.v2.pendingDilemma)?.title+'.');
 if(action.type==='negotiate'){
  const quote=negotiationQuote(original,action.actorId,action.choice),g=structuredClone(original);
  spend(g,quote.cost);advanceTime(g,quote.months);g.support=clamp(g.support+quote.support);g.reputation=clamp(g.reputation+quote.reputation);
  g.v2!.negotiations={...g.v2!.negotiations,[action.actorId]:quote.next};invalidateV2(g,'actor');g.acknowledged=[];
  record(g,'Mesa de negociación · '+quote.condition.actor.name,quote.detail,quote.cost,quote.months);return g;
 }
 if(original.v2&&action.type==='commit'){
  if([0,1,2,3,4].some(p=>!original.v2!.completed.includes(p))||Object.values(original.v2.reviews).some(r=>r.length))throw new Error('Revisa y confirma las etapas pendientes antes de comprometer la inversión.');
  const missing22=v22Missing(original,5);if(missing22)throw new Error(missing22);
 }
 if(original.v2&&action.type==='next'){
  const missing22=v22Missing(original,original.phase);if(missing22)throw new Error(missing22);
  if(original.phase===0&&!original.v2.tree)throw new Error('Construye y confirma el Árbol del problema: ubica cada tarjeta en un nivel o déjala fuera.');
  if(original.phase===2){const missing=budgetBasics(original.budget,original.v2.budgetLines??[]);if(missing.length)throw new Error('Construye los datos básicos del presupuesto antes de avanzar: '+missing.join('; ')+'. Usa «Presupuesto detallado» para agregar partidas con cantidad y costo unitario.');}
  if(original.phase===2&&(original.v2.chain.length<5||original.v2.connections.length<4))throw new Error('Construye cinco niveles y al menos cuatro conexiones en la cadena de valor.');
  if(original.phase===4&&(!original.v2.regulatory.reason||!original.sdgs.length||original.sdgs.some(id=>!original.v2!.sdgReasons[id])))throw new Error('Confirma el argumento regulatorio y sustenta los ODS seleccionados.');
 }
 let input=original;
 if(original.v2&&action.type==='commit'){
  input=structuredClone(original);
  for(const c of negotiationCommitments(input)){
   input.support=clamp(input.support+(c.funded?8:-10));input.reputation=clamp(input.reputation+(c.funded?3:-12));
   record(input,c.funded?'Compromiso respaldado':'Compromiso sin respaldo',`${c.actor.name}: ${c.allocated} de ${c.minimum} M en ${c.name}. ${c.funded?'Apoyo +8; legitimidad +3.':'Apoyo −10; legitimidad −12; mayor exposición social.'}`);
  }
 }
 let next=v22Actions.includes(action.type)?applyV22(input,action as ActionV22):v2Actions.includes(action.type)?applyV2(input,action as ActionV2):coreAct(input,action,withComparison);
 if(!next.v2)return next;
 if(action.type==='budget')next.v2.budgetLines=structuredClone(action.lines??original.v2?.budgetLines??[]);
 if(['budget','assumptions','alternative','policy'].includes(action.type)){const field=dependencyFields[action.type];if(JSON.stringify(original[field])===JSON.stringify(next[field]))next.acknowledged=[...original.acknowledged];}
 if(action.type==='next'){next.v2.completed=[...new Set([...next.v2.completed,original.phase])];delete next.v2.reviews[original.phase];if(!original.v2?.completed.includes(original.phase))triggerDilemma(next,original.phase);}
 if(action.type==='commit'){next.v2.completed=[...new Set([...next.v2.completed,5])];delete next.v2.reviews[5];if(next.snapshot){next.snapshot.decisionState={...structuredClone(original),justification:next.justification};}}
 if(action.type==='commit'&&next.snapshot)applyCommitConsequences(next);
 if(next.outcome)next.v2.completed=[...new Set([...next.v2.completed,6,7])];
 const key=dependencyFields[action.type];
 const changed=key?(JSON.stringify(original[key])!==JSON.stringify(next[key])||(action.type==='budget'&&JSON.stringify(original.v2?.budgetLines??[])!==JSON.stringify(next.v2.budgetLines??[]))):['chain','actorMap','sdgReasons','regulatory','resetStage','tree',...v22Actions].includes(action.type)&&JSON.stringify(original.v2)!==JSON.stringify(next.v2);
 if(changed){
  const label=action.type==='resetStage'?['nodes','alternative','chain','regulatory','policy'][original.phase]:action.type==='mga'?(action.section==='links'?'nodes':action.section==='chain'?'chain':'regulatory'):action.type==='sdgReasons'?'alignment':action.type==='tree'?'nodes':action.type;
  invalidateV2(next,label);
  if(v2Actions.includes(action.type))record(next,'Expediente V2 confirmado',label+' registrado; consulta las dependencias pendientes.');
  if(original.v2?.completed.includes(original.phase)&&['nodes','tree','target','objective','alternative','budget','activities','indicators','assumptions','policy','alignment','chain','regulatory','sdgReasons','resetStage',...v22Actions].includes(action.type)){
   if(next.v2?.v22?.exploration)record(next,'Revisión confirmada','Modo exploración: el cambio no consume recursos. Revisa etapas afectadas.',0,0);else{const fee=scenarioById(next.scenarioId).budget*.002;spend(next,fee);advanceTime(next,1);record(next,'Revisión confirmada','Se conservó el trabajo. Revisa etapas afectadas: 0,2 % del presupuesto base y un mes.',fee,1);}
  }
 }
 return next;
}

import {assessQuestion,type QuestionAction} from './questionsV2';
import {negotiationQuote,negotiationCommitments,type NegotiationAction} from './negotiations';
import {scoreV2} from './scoringV2';

import { drawDilemma, dilemmaById, pendingDilemma, effectCash, applyStateEffects, describeEffects, fillText } from "./dilemmas";
import { applyRegulatoryConsequences } from "./regulationLab";

function triggerDilemma(g: GameState, completedPhase: number) {
  const t = drawDilemma(g, completedPhase);
  if (!t || !g.v2) return;
  g.v2.pendingDilemma = t.id;
  g.v2.dilemmas = [...(g.v2.dilemmas ?? []), { id: t.id, phase: completedPhase, month: g.month }];
  record(g, "Dilema: " + fillText(g, t.title), fillText(g, t.context));
}
function resolveDilemma(original: GameState, choiceId: string): GameState {
  const t = pendingDilemma(original);
  if (!t || !original.v2) throw new Error("No hay un dilema pendiente.");
  if (original.snapshot || original.outcome) throw new Error("La inversión ya fue comprometida.");
  const c = t.choices.find((c) => c.id === choiceId);
  if (!c) throw new Error("Opción de dilema inválida.");
  const g = structuredClone(original),
    v = g.v2!,
    cash = effectCash(g, c.effects);
  if (cash < 0) spend(g, -cash);
  if (cash > 0) {
    g.cash += cash;
    v.inflows = (v.inflows ?? 0) + cash;
  }
  if (c.effects.months) advanceTime(g, c.effects.months);
  applyStateEffects(g, c.effects);
  if (c.delayed) v.delayed = [...(v.delayed ?? []), { source: fillText(g, t.title), note: c.delayed.note, effects: c.delayed.effects }];
  v.pendingDilemma = undefined;
  v.dilemmas = (v.dilemmas ?? []).map((d) => (d.id === t.id ? { ...d, choice: c.id } : d));
  v.consequences = [
    ...(v.consequences ?? []),
    { kind: "inmediata", title: fillText(g, t.title) + " · " + c.label, detail: describeEffects(g, c.effects) + ". " + c.lesson, month: g.month, phase: g.phase },
  ];
  record(g, "Decisión: " + c.label, describeEffects(g, c.effects) + ". " + c.lesson + (c.delayed ? " Puede tener consecuencias posteriores." : ""), Math.max(0, -cash), c.effects.months ?? 0);
  g.acknowledged = [];
  return g;
}
/** Delayed consequences of earlier dilemmas and regulatory design materialise when the plan meets reality. */
function applyCommitConsequences(g: GameState) {
  const v = g.v2!;
  for (const d of v.delayed ?? []) {
    applyStateEffects(g, d.effects);
    v.consequences = [...(v.consequences ?? []), { kind: "diferida", title: d.source, detail: d.note + " (" + describeEffects(g, d.effects) + ")", month: g.month, phase: g.phase }];
    record(g, "Consecuencia diferida: " + d.source, d.note + " " + describeEffects(g, d.effects) + ".");
  }
  v.delayed = [];
  for (const c of applyRegulatoryConsequences(g)) {
    v.consequences = [...(v.consequences ?? []), c];
    record(g, c.title, c.detail);
  }
}

import { generalObjectiveOptions, specificObjectiveOptions, impactCards, valuableCards, valuationCharge, type ImpactPlacement, type ValuationChoice } from "./valuation";
import { missionFlowCase } from "./missionFlow";
import { valuationMethods } from "../data/valuationMethods";
import { rpcTable } from "../data/rpc";
import { moduleEnabled } from "../data/missionProfiles";
import type { EconomicRowInput, RowInput } from "./flows";
import { committeeQuestions } from "./committee";

export type ActionV22 =
  | { type: "objectives"; general: string; specific: string[] }
  | { type: "impacts"; placements: ImpactPlacement[] }
  | { type: "valuation"; choices: ValuationChoice[] }
  | { type: "flow"; rows: RowInput[] }
  | { type: "economic"; rows: EconomicRowInput[]; benefits: string[] }
  | { type: "committee"; answers: Record<string, string> };
const v22Stage: Record<ActionV22["type"], number> = { objectives: 1, impacts: 2, valuation: 3, flow: 3, economic: 3, committee: 5 };
const kinds = ["inversion", "operacion", "mantenimiento", "reinversion", "ingreso", "residual", "excluir"];
const impactKinds = ["producto", "efecto", "impactoPositivo", "impactoNegativo", "problema", "irrelevante"];
/** Requirements of the V2.2 academic modules before leaving a stage (or committing, stage 5). */
export function v22Missing(g: GameState, phase: number): string | null {
  const v = g.v2?.v22;
  if (!v) return null;
  const on = (m: Parameters<typeof moduleEnabled>[1]) => moduleEnabled(g.scenarioId, m);
  if (phase === 1 && !v.objectives) return "Construye y confirma el objetivo general y los objetivos específicos.";
  if (phase === 2 && !v.impacts) return "Clasifica y confirma los efectos e impactos del proyecto.";
  if (phase === 3) {
    if (on("valuation") && !v.valuation?.choices.length) return "Valora al menos un impacto en el módulo de valoración económica.";
    if (!v.flow) return "Construye y confirma el flujo financiero.";
    if (on("economicFlow") && !v.economic) return "Construye y confirma el flujo económico con RPC.";
  }
  if (phase === 5 && on("committee") && Object.keys(v.committee?.answers ?? {}).length < committeeQuestions(g).length)
    return "Responde las preguntas del comité evaluador antes de comprometer la inversión.";
  return null;
}
/** V2.2 academic actions. They validate content, record the confirmation and, for valuation studies, spend money and time. */
function applyV22(original: GameState, a: ActionV22): GameState {
  if (!original.v2?.v22) throw new Error("Este módulo corresponde a partidas V2.2. Inicia una misión nueva.");
  if (original.snapshot || original.outcome) throw new Error("La inversión ya fue comprometida.");
  if (original.phase !== v22Stage[a.type]) throw new Error("Visita la etapa correspondiente para confirmar.");
  const g = structuredClone(original),
    v = g.v2!.v22!;
  v.attempts = { ...v.attempts, [a.type]: (v.attempts?.[a.type] ?? 0) + 1 };
  switch (a.type) {
    case "objectives": {
      const general = generalObjectiveOptions(g).map((o) => o.id),
        specific = specificObjectiveOptions(g).map((o) => o.id);
      if (!general.includes(a.general) || !a.specific.length || a.specific.some((id) => !specific.includes(id)) || new Set(a.specific).size !== a.specific.length)
        throw new Error("Elige un objetivo general y al menos un objetivo específico de las opciones.");
      v.objectives = { general: a.general, specific: [...a.specific] };
      g.objective = a.general;
      record(g, "Objetivos confirmados", `Objetivo general y ${a.specific.length} objetivo(s) específico(s).`);
      break;
    }
    case "impacts": {
      const ids = impactCards(g).map((c) => c.id);
      if (a.placements.some((p) => !ids.includes(p.id) || !impactKinds.includes(p.kind)) || new Set(a.placements.map((p) => p.id)).size !== a.placements.length)
        throw new Error("Clasifica tarjetas existentes, una vez cada una.");
      if (a.placements.length < ids.length) throw new Error("Clasifica todas las tarjetas: también las irrelevantes.");
      v.impacts = { placements: structuredClone(a.placements), builtFor: g.alternative };
      record(g, "Efectos e impactos clasificados", `${a.placements.filter((p) => p.kind.startsWith("impacto")).length} impactos identificados.`);
      break;
    }
    case "valuation": {
      const cards = valuableCards(g).map((c) => c.id),
        methods = valuationMethods.map((m) => m.id);
      if (a.choices.some((c) => !cards.includes(c.impactId) || !methods.includes(c.method) || !["basico", "completo"].includes(c.study) || !Number.isFinite(c.quantity) || c.quantity < 0) || new Set(a.choices.map((c) => c.impactId)).size !== a.choices.length)
        throw new Error("Cada impacto valorado necesita un método, un tipo de estudio y una medición no negativa.");
      const charge = valuationCharge(g, a.choices);
      if (charge.cost > 0) spend(g, charge.cost);
      if (charge.months) advanceTime(g, charge.months);
      const paid = { ...(v.valuation?.paid ?? {}) };
      for (const c of a.choices) if (paid[c.impactId] !== "completo") paid[c.impactId] = c.study;
      v.valuation = { choices: structuredClone(a.choices), paid, builtFor: g.alternative };
      record(g, "Valoración económica confirmada", `${a.choices.length} impacto(s) valorados.${charge.cost ? " Estudios de valoración." : ""}`, charge.cost, charge.months);
      break;
    }
    case "flow": {
      const c = missionFlowCase(g);
      if (!c) throw new Error("Selecciona una alternativa.");
      if (a.rows.some((r) => !c.rubros.some((x) => x.id === r.rubroId) || !kinds.includes(r.kind) || !Number.isFinite(r.amount) || r.amount < 0 || Object.values(r.overrides ?? {}).some((x) => !Number.isFinite(x))))
        throw new Error("Revisa los rubros: tipo válido y montos no negativos.");
      v.flow = { rows: structuredClone(a.rows), builtFor: g.alternative };
      record(g, "Flujo financiero confirmado", `${a.rows.filter((r) => r.kind !== "excluir").length} rubros en el flujo.`);
      break;
    }
    case "economic": {
      const c = missionFlowCase(g);
      if (!c) throw new Error("Selecciona una alternativa.");
      const rpcs = rpcTable.map((r) => r.id);
      if (a.rows.some((r) => !c.rubros.some((x) => x.id === r.rubroId) || !rpcs.includes(r.rpc)) || a.benefits.some((id) => !c.benefits.some((b) => b.id === id)))
        throw new Error("Usa rubros del flujo, RPC de la tabla y beneficios valorados.");
      v.economic = { rows: structuredClone(a.rows), benefits: [...a.benefits], builtFor: g.alternative };
      record(g, "Flujo económico confirmado", `RPC aplicadas a ${a.rows.length} rubros; ${a.benefits.length} beneficio(s) valorados incluidos.`);
      break;
    }
    case "committee": {
      const qs = committeeQuestions(g);
      if (qs.some((q) => !q.options.some((o) => o.id === a.answers[q.id])))
        throw new Error("Responde todas las preguntas del comité.");
      v.committee = { answers: { ...a.answers } };
      record(g, "Defensa ante el comité evaluador", "Respuestas registradas; la retroalimentación completa aparece en el resultado.");
      break;
    }
  }
  return g;
}
