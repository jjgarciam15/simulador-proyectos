import type { Scenario } from "./types";
export function validateMission(s: Scenario) {
  const errors: string[] = [];
  const finite = (v: number) => Number.isFinite(v) && v >= 0;
  if (
    !s.id ||
    !s.title ||
    !finite(s.budget) ||
    s.budget === 0 ||
    !finite(s.deadline) ||
    s.deadline === 0
  )
    errors.push("Identificación, presupuesto o plazo inválido");
  if (s.affected > s.population || !finite(s.affected))
    errors.push("Población inconsistente");
  if (
    s.alternatives.length < 2 ||
    new Set(s.alternatives.map((a) => a.id)).size !== s.alternatives.length
  )
    errors.push("Alternativas insuficientes o duplicadas");
  for (const a of s.alternatives) {
    if (
      !a.product ||
      !a.causes.length ||
      a.causes.some((id) => !s.nodes.some((n) => n.id === id)) ||
      ![a.capex, a.opex, a.months, a.life, a.coverage].every(finite) ||
      a.coverage > 1
    )
      errors.push("Alternativa incompleta: " + a.id);
  }
  if (!s.alternatives.some((a) => a.capex < s.budget * 1.35))
    errors.push("No existe inversión de referencia financiable");
  for (const n of s.nodes) {
    const seen = new Set<string>();
    let current: typeof n | undefined = n;
    while (current?.parent) {
      if (seen.has(current.id)) {
        errors.push("Dependencia circular del Árbol del problema");
        break;
      }
      seen.add(current.id);
      current = s.nodes.find((x) => x.id === current!.parent);
      if (!current) {
        errors.push("Referencia causal inexistente");
        break;
      }
    }
  }
  for (const e of s.events)
    if (
      !e.description ||
      !finite(e.probability) ||
      e.probability > 1 ||
      ![e.cost, e.delay, e.benefit].every(Number.isFinite) ||
      (e.cost === 0 && e.delay === 0 && e.benefit === 0)
    )
      errors.push("Evento sin consecuencia válida: " + e.id);
  if (
    s.sdgs.length < 2 ||
    s.sdgs.some(
      (id) =>
        id < 1 ||
        id > 17 ||
        s.alternatives.some((a) => !Number.isFinite(a.sdg[id])),
    )
  )
    errors.push("ODS sin criterio de impacto");
  if (
    !s.instruments.some((p) => p.id === "none") ||
    s.instruments.some((p) => ![p.admin, p.compliance].every(finite))
  )
    errors.push("Instrumentos regulatorios inválidos");
  if (s.studies.some((st) => !finite(st.cost) || !finite(st.months)))
    errors.push("Estudio con recursos negativos");
  return errors;
}
