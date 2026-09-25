import type { GameState } from "./types";
import { available, riskLevel } from "./engine";
import { scenarioById } from "../data/scenarios";
import { money, clamp } from "./finance";
export type ResourceId =
  | "cash"
  | "time"
  | "information"
  | "capacity"
  | "support"
  | "reputation"
  | "risk"
  | "sustainability";
export interface ResourceView {
  id: ResourceId;
  label: string;
  value: number;
  display: string;
  level: number;
  explanation: string;
  influence: string;
  lowIsGood?: boolean;
}
export function resourceViews(g: GameState): ResourceView[] {
  const s = scenarioById(g.scenarioId);
  return [
    {
      id: "cash",
      label: "Saldo libre",
      value: available(g),
      display: "$ " + money(available(g)),
      level: clamp((available(g) / s.budget) * 100),
      explanation:
        "Caja que aún no está comprometida. Reservar una inversión reduce este saldo aunque el dinero todavía no se haya gastado.",
      influence:
        "Estudios y respuestas consumen caja; crédito y aportes la aumentan con condiciones. La reserva de contingencia forma parte del compromiso.",
    },
    {
      id: "time",
      label: "Plazo restante",
      value: s.deadline - g.month,
      display:
        (s.deadline - g.month < 0 ? "+" : "") +
        Math.abs(s.deadline - g.month) +
        " meses" +
        (s.deadline - g.month < 0 ? " fuera de plazo" : ""),
      level: clamp(((s.deadline - g.month) / s.deadline) * 100),
      explanation:
        "Meses hasta el límite del encargo. El reloj avanza al estudiar, reformular y ejecutar; un valor negativo indica retraso frente al límite.",
      influence:
        "Consulta duración y dependencias del cronograma. Algunas respuestas ahorran dinero a cambio de más meses.",
    },
    {
      id: "information",
      label: "Información",
      value: g.quality,
      display: Math.round(g.quality) + " /100",
      level: clamp(g.quality),
      explanation:
        "Calidad informativa disponible para decidir. No es una probabilidad de éxito ni una medida estadística de confianza.",
      influence:
        "Los estudios aumentan conocimiento y reducen exposición a ciertos eventos; las condiciones subyacentes no cambian.",
    },
    {
      id: "capacity",
      label: "Capacidad",
      value: g.capacity,
      display: Math.round(g.capacity) + " /100",
      level: clamp(g.capacity),
      explanation:
        "Indicador orientativo de capacidad frente a la complejidad de la alternativa. No representa número de trabajadores ni avance de obra.",
      influence:
        "La complejidad de la propuesta determina este indicador. Revisa actividades, operación y formación para sostener la entrega.",
    },
    {
      id: "support",
      label: "Apoyo",
      value: g.support,
      display: Math.round(g.support) + " /100",
      level: clamp(g.support),
      explanation:
        "Aceptación y disposición de los actores a colaborar. Influye en la exposición a eventos sociales y en la cofinanciación.",
      influence:
        "Consultar, involucrar y negociar aumentan apoyo; ignorar actores o reducir alcance puede deteriorarlo.",
    },
    {
      id: "reputation",
      label: "Legitimidad",
      value: g.reputation,
      display: Math.round(g.reputation) + " /100",
      level: clamp(g.reputation),
      explanation:
        "Confianza institucional acumulada en la trayectoria. Se considera en la dimensión final de legitimidad.",
      influence:
        "El trato con actores y las respuestas a eventos pueden fortalecerla o desgastarla.",
    },
    {
      id: "risk",
      label: "Riesgo residual",
      value: riskLevel(g),
      display: Math.round(riskLevel(g)) + " /100",
      level: clamp(100 - riskLevel(g)),
      lowIsGood: true,
      explanation:
        "Índice educativo de exposición residual. Menor es mejor. No equivale a la probabilidad de que aparezca cualquier evento.",
      influence:
        "Estudios, mitigaciones e información reducen exposición. El apoyo bajo aumenta vulnerabilidad social.",
    },
    {
      id: "sustainability",
      label: "Potencial ambiental",
      value: g.sustainability,
      display: Math.round(g.sustainability) + " /100",
      level: clamp(g.sustainability),
      explanation:
        "Señal ambiental de la tecnología y sus adaptaciones. La contribución final a los ODS se calcula aparte, con cobertura, desempeño y coherencia.",
      influence:
        "La alternativa elegida y las adaptaciones tecnológicas cambian esta señal. Consulta los ODS para evaluar tensiones y resultados.",
    },
  ];
}
export function resourceChanges(before: GameState, after: GameState) {
  if (before.id !== after.id) return [];
  const previous = resourceViews(before);
  return resourceViews(after).flatMap((r, i) => {
    const delta = r.value - previous[i].value;
    return Math.abs(delta) < 0.01
      ? []
      : [
          {
            ...r,
            delta,
            reason: after.journal.at(-1)?.title ?? "Estado actualizado",
            favorable:
              r.id === "cash" || r.id === "time"
                ? null
                : r.lowIsGood
                  ? delta < 0
                  : delta > 0,
          },
        ];
  });
}
