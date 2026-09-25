import { profileOf, type Module } from "../../data/missionProfiles";

const moduleLabel: Record<Module, string> = {
  valuation: "Valoración económica",
  economicFlow: "Flujo económico con RPC",
  distributive: "Evaluación distributiva",
  stress: "Pruebas de estrés",
  switching: "Valor de quiebre",
  committee: "Comité evaluador",
};
/** Mission profile shown before starting: level, estimated duration, concepts and enabled modules. */
export function MissionProfileCard({ id }: { id: string }) {
  const p = profileOf(id);
  return (
    <div className="v22-profile" aria-label="Perfil de la misión">
      <span className="badge">{p.level}</span>
      <span>Duración estimada: {p.duration}</span>
      <p>
        <strong>Conceptos:</strong> {p.concepts.join(" · ")}
      </p>
      <p>
        <strong>Módulos:</strong>{" "}
        {(Object.keys(moduleLabel) as Module[]).map((m) => (
          <span key={m} className={"v22-module " + (p.modules.includes(m) ? "on" : "off")}>
            {p.modules.includes(m) ? "✓" : "✕"} {moduleLabel[m]}
          </span>
        ))}
      </p>
    </div>
  );
}
/** Learning mode (immediate feedback, hints) vs evaluation mode (recorded decisions, deferred feedback). */
export function ModeChoice({ value, onChange }: { value: "aprendizaje" | "evaluacion"; onChange: (m: "aprendizaje" | "evaluacion") => void }) {
  return (
    <fieldset className="v22-choice">
      <legend>Modo de juego</legend>
      <label className={value === "aprendizaje" ? "chosen" : ""}>
        <input type="radio" name="mode" checked={value === "aprendizaje"} onChange={() => onChange("aprendizaje")} />
        <span>
          Aprendizaje
          <small>Retroalimentación inmediata, pistas, biblioteca y fórmulas visibles.</small>
        </span>
      </label>
      <label className={value === "evaluacion" ? "chosen" : ""}>
        <input type="radio" name="mode" checked={value === "evaluacion"} onChange={() => onChange("evaluacion")} />
        <span>
          Evaluación (modo examen)
          <small>Menos ayuda, una pista por ejercicio, decisiones registradas y retroalimentación completa al final.</small>
        </span>
      </label>
    </fieldset>
  );
}
