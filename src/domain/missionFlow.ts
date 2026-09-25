import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { technicalBudget } from "./engine";
import type { FlowBenefit, FlowCase, Rubro } from "./flows";
import { valuationSummary } from "./valuation";

/** Useful life of civil works (years). Equipment lasts the alternative's useful life, which is the evaluation horizon. */
export const civilWorksLife = 25;
/**
 * Builds the project cash-flow case from the game: the alternative (investment, operation, revenue, useful life),
 * the target population, the approved budget and the player's valuations. Nothing is typed twice.
 */
export function missionFlowCase(g: GameState, alternativeId = g.alternative): FlowCase | null {
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((x) => x.id === alternativeId);
  if (!a) return null;
  const state = { ...g, alternative: a.id },
    scale = g.target / s.affected,
    capex = technicalBudget(state, a),
    opex = a.opex * scale * g.assumptions.opex,
    revenue = a.revenue * scale * g.assumptions.price,
    obras = capex * 0.55,
    equipos = capex * 0.25,
    manoObra = capex * 0.2,
    fisica = obras + equipos,
    horizon = g.assumptions.life || a.life,
    residual = (obras * Math.max(0, civilWorksLife - horizon)) / civilWorksLife,
    replacement = Math.max(2, Math.round(horizon / 2)),
    constructionEnd = a.months > 12 ? 1 : 0,
    r = (x: Rubro) => x;
  const rubros: Rubro[] = [
    r({ id: "obras", label: `Obras civiles de ${a.name.toLowerCase()}`, kind: "inversion", amount: obras, timing: { type: "construccion" }, given: "entregado", rpc: "obras", why: "Es inversión: ocurre durante la construcción." }),
    r({ id: "equipos", label: "Equipos importados", kind: "inversion", amount: equipos, timing: { type: "construccion" }, given: "entregado", rpc: "divisa", why: "Inversión en bienes importados: su RPC es la de la divisa." }),
    r({ id: "manoObra", label: "Mano de obra no calificada de la obra", kind: "inversion", amount: manoObra, timing: { type: "construccion" }, given: "entregado", rpc: "moNoCalificada", why: "Parte de la inversión; su RPC corrige el salario de mercado." }),
    r({ id: "supervision", label: "Supervisión e interventoría (de tu presupuesto)", kind: "inversion", amount: g.budget.oversight, timing: { type: "construccion" }, given: "entregado", rpc: "moCalificada", why: "Viene de tu presupuesto: se paga durante la construcción." }),
    r({ id: "gestion", label: "Gestión ambiental y social (de tu presupuesto)", kind: "inversion", amount: g.budget.environment + g.budget.social, timing: { type: "periodo", period: 0 }, given: "entregado", rpc: "moCalificada", why: "Viene de tu presupuesto: acompaña el inicio del proyecto." }),
    r({ id: "personal", label: "Personal de operación", kind: "operacion", amount: opex * 0.5, timing: { type: "operacion" }, given: "entregado", rpc: "moCalificada", why: "Costo recurrente de operar el servicio cada año." }),
    r({ id: "insumos", label: "Energía e insumos de operación", kind: "operacion", amount: opex * 0.5, timing: { type: "operacion" }, given: "entregado", rpc: "energia", why: "Costo recurrente de operar el servicio cada año." }),
    r({ id: "mantenimiento", label: "Mantenimiento preventivo anual", kind: "mantenimiento", amount: fisica * 0.025, timing: { type: "operacion" }, given: "calcular", formula: "2,5 % de la inversión física (obras + equipos)", rpc: "obras", why: "Conserva la capacidad del activo durante su vida útil." }),
    r({ id: "reposicion", label: "Reposición de equipos", kind: "reinversion", amount: equipos * 0.5, timing: { type: "periodo", period: replacement }, given: "calcular", formula: `50 % del valor de los equipos, en el año ${replacement}`, rpc: "divisa", why: "Los componentes electromecánicos se desgastan antes: se reponen a mitad del horizonte." }),
    r({ id: "tarifas", label: "Ingresos por tarifas", kind: "ingreso", amount: revenue, timing: { type: "operacion" }, given: "entregado", rpc: "transferencia", why: "En el flujo económico la tarifa es un pago de usuarios al operador; el beneficio real ya está en los impactos valorados." }),
    r({ id: "residual", label: "Valor residual de las obras civiles", kind: "residual", amount: residual, timing: { type: "final" }, given: "calcular", formula: `obras civiles × (vida útil ${civilWorksLife} − horizonte ${horizon}) / vida útil ${civilWorksLife}`, rpc: "obras", why: "Las obras civiles duran más que el horizonte de evaluación: su valor remanente entra en el último periodo." }),
    r({ id: "estudios", label: "Estudios de preinversión ya pagados", kind: "excluir", amount: Math.max(g.spent, s.budget * 0.01), timing: { type: "ninguno" }, given: "entregado", rpc: "transferencia", why: "Es un costo hundido: ya se pagó y no cambia con la decisión de invertir." }),
    r({ id: "contingencia", label: "Reserva de contingencia (de tu presupuesto)", kind: "excluir", amount: g.budget.contingency, timing: { type: "ninguno" }, given: "entregado", rpc: "transferencia", why: "Es una reserva: solo se vuelve costo si ocurre el imprevisto, y eso se analiza en sensibilidad." }),
  ];
  if (s.role === "publico")
    rubros.push(r({ id: "cofinanciacion", label: "Aporte del fondo de cofinanciación", kind: "excluir", amount: s.budget * 0.2, timing: { type: "ninguno" }, given: "entregado", rpc: "transferencia", why: "Es financiación: cambia quién paga, no es un ingreso generado por el proyecto." }));
  const benefits: FlowBenefit[] =
    alternativeId === g.alternative
      ? valuationSummary(g).rows.map((row) => ({
          id: row.card.id,
          label: row.card.text,
          annual: row.result.annual,
          overlap: row.card.valuation?.overlap,
          source: row.choice.method,
        }))
      : [];
  return {
    id: g.scenarioId + ":" + a.id,
    title: a.name,
    horizon,
    constructionEnd,
    financialRate: g.assumptions.discount,
    socialRate: g.assumptions.socialDiscount,
    rubros,
    benefits,
  };
}
