import NegotiationDesk from './NegotiationDesk';
import ActorPanel from './ActorPanel';
import ProblemTreeBuilder from './ProblemTreeBuilder';
import { useState } from 'react';
import {useDraftGuard} from '../components/workbench';
import type { GameState } from '../domain/types';
import type { Action } from '../domain/engine';
import { estimate, available } from '../domain/engine';
import { scenarioById } from '../data/scenarios';
import { money, number } from '../domain/finance';
import { Panel,Button,Range,Tip,Metric,Chart } from '../components/ui';
import { Check, Search, Users, Clock } from 'lucide-react';
export default function Diagnosis({g,send}:{g:GameState;send:(a:Action)=>void}){
 const s=scenarioById(g.scenarioId),[target,setTarget]=useState(g.target),[growth,setGrowth]=useState(.02);
 useDraftGuard(target!==g.target);
 return <><Panel className="brief-panel" kicker="EL ENCARGO" title={s.territory}><p className="brief">{s.brief}</p><div className="metric-grid"><Metric label="Población de referencia" value={number(s.population)}/><Metric label="Población afectada" value={number(s.affected)}/><Metric label="Recursos iniciales" value={'$ '+money(g.v2?.initialCash??s.budget)} sub="Millones de COP"/></div><div className="constraint-row">{s.constraints.map(c=><span key={c}>{c}</span>)}</div></Panel>
 <Panel title="La información también tiene un precio" kicker="01 / INVESTIGA"><p className="muted">Puedes invertir en conocer el problema o decidir con lo que sabes. Ningún estudio elimina toda la incertidumbre.</p><div className="study-grid">{s.studies.map(st=>{const bought=g.studies.includes(st.id);return <article className={'study '+(bought?'purchased':'')} key={st.id}><div className="study-title"><Search size={19}/><h4>{st.name}</h4>{bought&&<Check size={18}/>}</div><p>{bought?st.finding:'Revela '+({demand:'demanda e intervalo esperado',technical:'restricciones y costos técnicos',environment:'condiciones ambientales y permisos',social:'barreras de acceso y aceptación'}[st.reveals])+'.'}</p><div className="study-price"><strong>$ {money(st.cost)}</strong><span><Clock size={13}/> {st.months} meses</span></div><Button secondary onClick={()=>send({type:'study',id:st.id})} disabled={bought||st.cost>available(g)}>{bought?'Estudio incorporado':'Contratar estudio'}{!bought&&<span>+{st.quality} información</span>}</Button></article>})}</div><div className="information-box"><span>Demanda esperada · {s.unit}</span><strong>{g.studies.includes('demanda')?number(s.demand*estimate(g,'demand')):'Información por precisar'}</strong><small>{g.studies.includes('demanda')?`Intervalo: ${number(s.demand*estimate(g,'demand')*.84)} – ${number(s.demand*estimate(g,'demand')*1.16)} · confianza orientativa: ${g.quality} %`:`Referencia preliminar: ${number(s.demand)}; variación posible ± ${g.difficulty==='experto'?40:30} %.`}</small></div></Panel>
 <ProblemTreeBuilder g={g} send={send}/>
 <Panel title="¿A quién vas a priorizar?" kicker="03 / FOCALIZA"><Range label="Población objetivo" min={Math.ceil(s.affected*.25)} max={s.affected} step={Math.max(1,Math.round(s.affected/100))} value={target} onChange={setTarget} format={number}/><div className="coverage-map">{Array.from({length:20},(_,i)=><div key={i} className={i<target/s.affected*20?'covered':''}><Users size={19}/></div>)}</div><div className="metric-grid"><Metric label="Objetivo / afectada" value={Math.round(target/s.affected*100)+' %'}/><Metric label="No priorizada" value={number(s.affected-target)}/><Metric label="Beneficiarios directos" value="Según alternativa" sub="La cobertura efectiva se calcula después"/></div><Button secondary onClick={()=>send({type:'target',value:target})}>Confirmar focalización</Button><Tip title="Cobertura y equidad">La población objetivo es el grupo priorizado dentro de la población afectada. Los beneficiarios directos son quienes reciben el servicio; los indirectos reciben efectos secundarios. Este mapa es esquemático, no representa geografía oficial.</Tip><Range label="Crecimiento exploratorio de demanda anual" min={0} max={.08} step={.005} value={growth} onChange={setGrowth} format={v=>(v*100).toFixed(1)+' %'}/><Chart data={Array.from({length:6},(_,y)=>({name:'Año '+y,demanda:Math.round(s.demand*estimate(g,'demand')*(1+growth)**y),oferta:s.supply}))} series={[{key:'demanda',name:'Demanda estimada',color:'#377864'},{key:'oferta',name:'Oferta existente',color:'#b79657'}]}/></Panel>
 {g.v2&&<ActorBuilder g={g} send={send}/>}<ActorPanel g={g} send={send}/>{g.v2&&<NegotiationDesk g={g} send={send}/>}</>;
}


import {ActorBuilder} from './BuildersV2';
