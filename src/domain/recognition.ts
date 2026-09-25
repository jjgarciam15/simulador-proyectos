import {lineTotal} from './budgetLines';
import {challengeProgress} from './challenges';
import type { GameState } from "./types";
import { scenarios, scenarioById } from "../data/scenarios";
import { causalQuality, chainQuality, indicatorReview } from "./mga";
import { model, selected, schedule } from "./engine";
import { money } from "./finance";
import { learningSummary } from "./learning";

function learningReport(g: GameState) {
  const s = learningSummary(g);
  return `<h2>Práctica de conceptos MGA y económicos</h2><p>Casos iniciales: ${s.initial.correct}/${s.initial.answered} aciertos. Transferencia a situaciones distintas: ${s.transfer.correct}/${s.transfer.answered}. Respuestas guardadas: ${s.attempts.length}/${s.total}. No equivale a una prueba validada de aprendizaje ni altera el puntaje del proyecto. Incluye el repaso que hayas realizado después del cierre.</p><table><tr><th>Concepto</th><th>Caso</th><th>Evidencia</th><th>Seguridad declarada</th></tr>${s.attempts.map((a) => `<tr><td>${escape(a.topic)}</td><td>${a.transfer ? "Transferencia" : "Inicial"}</td><td>${a.correct ? "Aplicado" : "Por repasar"}</td><td>${a.confidence === "seguro" ? "Seguro" : "Con dudas"}</td></tr>`).join("")}</table>`;
}
export interface Medal {
  id: string;
  title: string;
  evidence: string;
}
export interface CampaignRecord {
  scenarioId: string;
  gameId: string;
  score: number;
  medals: Medal[];
}
export type CampaignVault = Record<string, CampaignRecord>;
export function performanceLabel(score: number) {
  return score >= 85
    ? "Desempeño destacado"
    : score >= 70
      ? "Desempeño sólido"
      : score >= 50
        ? "En desarrollo"
        : "Necesita revisión";
}
export function projectMedals(g: GameState): Medal[] {
  if (!g.outcome) return [];
  const medals: Medal[] = [];
  if (g.contentVersion >= 3 && causalQuality(g) === 100 && g.objective === "n0")
    medals.push({
      id: "causal",
      title: "Cartógrafo del problema",
      evidence:
        "Conectaste las cuatro relaciones causales esperadas y el objetivo general corresponde al problema central.",
    });
  if (g.contentVersion >= 3 && (g.v2?chainV2Score(g):chainQuality(g)) === 100)
    medals.push({
      id: "chain",
      title: "Arquitecto de soluciones",
      evidence:
        g.v2 ? "Construiste y conectaste insumos, actividades, productos, resultados e impactos con coherencia estructural." : "Vinculaste causa, objetivo específico, producto y al menos dos actividades con recursos.",
    });
  if (
    g.indicators.some((i) => i.kind === "Producto") &&
    g.indicators.some((i) => i.kind === "Resultado") &&
    !indicatorReview(g).length
  )
    medals.push({
      id: "measurement",
      title: "Guardián de la evidencia",
      evidence:
        "Diferenciaste indicadores de producto y resultado sin inconsistencias estructurales detectadas. La calidad de las fuentes requiere revisión humana.",
    });
  if (g.studies.length >= 3 && g.mitigations.length >= 1)
    medals.push({
      id: "risk",
      title: "Decisor preparado",
      evidence:
        "Contrataste al menos tres estudios y confirmaste una medida de mitigación antes de ejecutar.",
    });
  if (
    g.outcome.status === "completado" &&
    g.outcome.coverage >= 0.6 &&
    g.outcome.social > 0
  )
    medals.push({
      id: "service",
      title: "Reconstructor del distrito",
      evidence:
        "Terminaste dentro del plazo, con cobertura observada de al menos 60 % y VPN social positivo.",
    });
  for (const m of v2Medals(g)) medals.push(m);
  return medals;
}
export function updateCampaign(
  vault: CampaignVault,
  g: GameState,
): CampaignVault {
  const o = g.outcome;
  if (!o || !["completado", "incumplimiento"].includes(o.status)) return vault;
  const old = vault[g.scenarioId];
  if (old && old.score >= o.score) return vault;
  return {
    ...vault,
    [g.scenarioId]: {
      scenarioId: g.scenarioId,
      gameId: g.id,
      score: o.score,
      medals: projectMedals(g),
    },
  };
}
export function campaignSummary(
  history: GameState[],
  vault: CampaignVault = {},
) {
  const records = history.reduce(updateCampaign, vault);
  const valid = scenarios.flatMap((s) =>
    records[s.id] ? [records[s.id]] : [],
  );
  const finished = valid.length === scenarios.length;
  return {
    records,
    completed: valid.length,
    total: scenarios.length,
    finished,
    score: finished
      ? Math.round(valid.reduce((n, r) => n + r.score, 0) / valid.length)
      : null,
  };
}
const escape = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function reportIndicators(g: GameState) {
  if (!g.outcome) return [];
  const a = selected(g),
    completed = ["completado", "incumplimiento"].includes(g.outcome.status);
  const progress = completed
    ? 1
    : a
      ? Math.min(
          1,
          g.elapsed /
            Math.max(
              1,
              Math.max(a.months, schedule(g.activities).duration) +
                g.assumptions.delay +
                g.delay,
            ),
        )
      : 0;
  return g.indicators.map((i) => {
    const measure = i.measure ?? "coverage";
    const observed =
      measure === "coverage"
        ? scenarioById(g.scenarioId).affected * g.outcome!.coverage
        : measure === "progress"
          ? progress * 100
          : measure === "spending"
            ? g.spent
            : completed && a
              ? model(g, a, true).benefit
              : 0;
    const unit = {
      coverage: "personas",
      progress: "%",
      spending: "M COP",
      benefit: "M COP / año",
    }[measure];
    return { ...i, observed, observedUnit: unit };
  });
}

import {chainV2Score} from './projectV2';
export function projectReport(g:GameState){
 if(!g.outcome)throw new Error('El informe requiere una misión cerrada.');
 const o=g.outcome,s=scenarioById(g.scenarioId),medals=projectMedals(g),a=o.assessment;
 const challenge=challengeProgress(g);
 const factor=['abandonado','insolvencia'].includes(o.status)?.35:1;
 const row=(key:unknown,value:unknown)=>`<tr><th>${escape(key)}</th><td>${escape(value)}</td></tr>`;
 return [
 '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
 `<title>Informe PROYECTA — ${escape(s.title)}</title>`,
 '<style>body{font:16px/1.6 system-ui,sans-serif;color:#183b3c;max-width:900px;margin:40px auto;padding:25px}h1{font-size:36px}h2{border-bottom:2px solid #adbd9c;padding-bottom:8px;margin-top:35px}.score{font-size:60px;font-weight:700;color:#43674c}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid #d7dfce}small{color:#64755e}li{margin:10px 0}.medal{background:#f3eedc;padding:18px;border-radius:10px;margin:12px 0}blockquote{border-left:3px solid #baa46f;padding-left:20px;white-space:pre-wrap}@media print{body{margin:0;padding:0;font-size:11pt}h2{break-after:avoid}tr,.medal{break-inside:avoid}}</style></head><body>',
 `<small>CONSEJO DE AURORA · INFORME FINAL</small><h1>${escape(s.title)}</h1><p>${escape(s.territory)}</p><div class="score">${o.score}/100</div><p>${performanceLabel(o.score)} · ${escape(o.status)}</p><p>Índice educativo de desempeño; no certifica conocimientos ni viabilidad oficial.</p>`,
 `<table>${row('Alternativa',s.alternatives.find(a=>a.id===g.alternative)?.name??'Sin seleccionar')}${row('Rol / dificultad',s.role+' / '+g.difficulty)}${row('Semilla / versión',g.seed+' / '+g.contentVersion+(g.v2?' · reglas V2':''))}${row('Mes de cierre / plazo',g.month+' / '+s.deadline)}${row('Partida',g.id)}</table>`,
 `<h2>Resultados esperados y observados</h2><table><tr><th>Medida</th><th>Esperado</th><th>Observado</th></tr><tr><td>VPN financiero · M COP</td><td>${money(o.expectedFinancial)}</td><td>${money(o.financial)}</td></tr><tr><td>VPN social · M COP</td><td>${money(o.expectedSocial)}</td><td>${money(o.social)}</td></tr></table>`,
 `<table>${row('Cobertura observada',(o.coverage*100).toFixed(1)+' %')}${row('Personas atendidas estimadas',Math.round(s.affected*o.coverage))}${row('Gastos ejecutados',money(g.spent))}${row('Caja al cierre',money(g.cash))}${row('Beneficio sacrificado observado',money(o.opportunity))}${row('Diferencia esperada',money(o.expectedOpportunity))}${row('Recursos desperdiciados / sobrecostos',money(o.wasted))}</table><p>Montos en millones de COP. No se suman recursos desperdiciados y costo de oportunidad. El beneficio social no es caja.</p>`,
 `<h2>Cómo se obtuvo el indicador</h2><p>Nota = redondear [máximo(0, mínimo(100, Σ(valor × peso) − ${(a?.penalty??0).toFixed(2)} + ${(a?.bonus??0).toFixed(2)})) × ${factor}].</p>${a?.adjustments?`<ul>${[...a.adjustments.bonuses.map(b=>`<li>+${b.points} ${escape(b.label)}: ${escape(b.reason)}</li>`),...a.adjustments.penalties.map(p=>`<li>−${p.points} ${escape(p.label)}: ${escape(p.reason)}</li>`)].join('')}</ul>`:''}<table><tr><th>Dimensión</th><th>Valor /100</th><th>Peso</th><th>Aporte antes del factor</th></tr>${o.dimensions.map(d=>`<tr><td>${escape(d.name)}</td><td>${d.value.toFixed(1)}</td><td>${(d.weight*100).toFixed(0)} %</td><td>${(d.value*d.weight).toFixed(2)}</td></tr>`).join('')}</table><p>Bandas educativas: 85–100 destacado; 70–84 sólido; 50–69 en desarrollo; 0–49 necesita revisión.</p>`,
 a?`<h2>Explicación V2</h2><p>${escape(a.story)}</p><ul>${a.notes.map(n=>`<li>${escape(n)}</li>`).join('')}</ul>`:'',
 `<h2>Seguimiento de indicadores</h2><table><tr><th>Indicador</th><th>Base / meta declaradas</th><th>Observado simulado</th><th>Verificación</th></tr>${reportIndicators(g).map(i=>`<tr><td>${escape(i.name)} · ${escape(i.kind)}</td><td>${i.baseline} / ${i.target} ${escape(i.unit)}</td><td>${i.observed.toLocaleString('es-CO',{maximumFractionDigits:1})} ${escape(i.observedUnit)}</td><td>${escape(i.source)} · ${escape(i.owner)} · ${escape(i.frequency)}</td></tr>`).join('')}</table><p>Revisa unidades declaradas y calculadas. Un cierre sin servicio no atribuye beneficios operativos del proyecto terminado.</p>`,
 `<h2>Reconocimientos por evidencias</h2>${medals.length?medals.map(m=>`<div class="medal"><strong>${escape(m.title)}</strong><p>${escape(m.evidence)}</p></div>`).join(''):'<p>Bitácora de experiencia: revisa las evidencias que faltan para obtener insignias.</p>'}`,
 `<h2>Lecciones</h2><ul>${o.lessons.map(l=>`<li>${escape(l)}</li>`).join('')}</ul><h2>Argumento del jugador</h2><blockquote>${escape(g.justification||'Sin registro.')}</blockquote><h3>Predicción</h3><blockquote>${escape(g.mga?.prediction||'Sin registro.')}</blockquote><h3>Supuesto externo</h3><blockquote>${escape(g.mga?.assumption||'Sin registro.')}</blockquote><h3>Reflexión final</h3><blockquote>${escape(g.mga?.reflection||'Sin registro. Guarda la reflexión y descarga de nuevo.')}</blockquote>`,
 `<h2>Diario de decisiones</h2><ol>${g.journal.map(d=>`<li><strong>Mes ${d.month}: ${escape(d.title)}</strong><p>${escape(d.detail)}</p></li>`).join('')}</ol>`,
 challenge?`<h2>Modo reto: ${escape(challenge.challenge.title)}</h2><p>${challenge.won?"Distinción: formulador bajo presión":"Reto no superado"}. Reconocimiento independiente de la nota.</p><ul>${challenge.goals.map(goal=>`<li>${escape(goal.label)}: ${escape(goal.value)} · ${goal.met?"Cumplido":"No cumplido"}</li>`).join('')}</ul>`:'',
 g.v2?.budgetLines?.length?`<h2>Presupuesto detallado aprobado</h2><p>El detalle está incluido en las asignaciones; no se suma de nuevo. Mantenimiento es anual, las demás partidas son reservas iniciales. No representa una contabilidad de facturas ejecutadas.</p><table><tr><th>Partida / categoría</th><th>Cantidad / unidad</th><th>Costo unitario M</th><th>Total M</th></tr>${g.v2.budgetLines.map(l=>`<tr><td>${escape(l.description)} / ${escape(l.category)}</td><td>${l.quantity} ${escape(l.unit)}</td><td>${money(l.unitCost)}</td><td>${money(lineTotal(l))}</td></tr>`).join('')}</table>`:'',
 learningReport(g),
 g.v2?`<h2>Argumentos ODS</h2><ul>${g.sdgs.map(id=>`<li>ODS ${id}: ${escape(g.v2?.sdgReasons[id]?.text??'Sin argumento')}</li>`).join('')}</ul><h2>Argumento regulatorio</h2><blockquote>${escape(g.v2.regulatory.reason)}</blockquote><h2>Prácticas V2</h2><ul>${Object.entries(g.v2.assessments).map(([id,r])=>`<li>${escape(id)}: ${r.choices.length} intentos, ${r.hints} pistas, ${r.score.toFixed(0)}/100.</li>`).join('')}</ul>`:'',
 '<footer><small>Datos simulados · adaptación educativa MGA · informe local sin servicios externos.</small></footer></body></html>'
 ].join('');
}

import { budgetReview } from "./budgetReview";
import { puzzleResult, recommendedPolicies } from "./regulationLab";
import { sdgReasonScore } from "./projectV2";
/** Iteration-2 achievements: each requires observable evidence, never mere progress. */
function v2Medals(g: GameState): Medal[] {
  if (!g.v2 || !g.outcome || !g.snapshot?.decisionState) return [];
  const plan = g.snapshot.decisionState,
    out: Medal[] = [],
    completed = g.outcome.status === "completado";
  if (completed && !g.loans.length && budgetReview(plan).score >= 80 && g.extraCost <= (plan.budget.contingency || 0))
    out.push({ id: "planner", title: "Planificador", evidence: "Terminaste sin crédito, con un presupuesto bien diagnosticado (≥ 80) y sobrecostos cubiertos por la contingencia." });
  if (chainV2Score(plan) >= 80)
    out.push({ id: "analyst", title: "Analista", evidence: "Tu cadena de valor alcanzó 80/100 o más al invertir." });
  if (plan.v2?.regulatory.chain && puzzleResult(plan).score >= 75 && recommendedPolicies(plan).includes(plan.policy))
    out.push({ id: "regulator", title: "Regulador", evidence: "La cadena causal regulatoria fue coherente (≥ 75) y el instrumento proporcional a la severidad real, incluso si fue no intervenir." });
  if (completed && g.eventIds.filter((id) => id !== "technical-reveal").length > 0 && g.outcome.coverage >= 0.5 && g.month <= scenarioById(g.scenarioId).deadline)
    out.push({ id: "riskmanager", title: "Gestor de riesgo", evidence: "Superaste al menos un evento y cerraste a tiempo con cobertura de 50 % o más." });
  if (sdgReasonScore(plan) >= 75 && plan.sdgs.length <= scenarioById(g.scenarioId).sdgs.length)
    out.push({ id: "sustainable", title: "Proyecto sostenible", evidence: "Seleccionaste y sustentaste ODS pertinentes (≥ 75) sin selección indiscriminada." });
  return out;
}
