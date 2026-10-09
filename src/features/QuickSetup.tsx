import { quickModules } from "../domain/quickGame";

/**
 * Tipo de partida: complete (the eight stages) or quick, with only the modules the player wants to practise.
 * The modules left out are solved with the reference answers and do not count in the grade.
 */
export default function QuickSetup({ stages, onChange }: { stages: number[] | null; onChange: (stages: number[] | null) => void }) {
  const toggle = (phase: number) => onChange(stages!.includes(phase) ? stages!.filter((p) => p !== phase) : [...stages!, phase].sort((a, b) => a - b));
  return (
    <fieldset className="v22-choice quick-setup">
      <legend>Tipo de partida</legend>
      <label className={stages ? "" : "chosen"}>
        <input type="radio" name="quick" checked={!stages} onChange={() => onChange(null)} />
        <span>
          Completa
          <small>Las ocho etapas, del diagnóstico al ex post.</small>
        </span>
      </label>
      <label className={stages ? "chosen" : ""}>
        <input type="radio" name="quick" checked={!!stages} onChange={() => onChange([2])} />
        <span>
          Rápida: solo los módulos que eliges
          <small>Las demás etapas llegan resueltas con la solución de referencia y no cuentan en la nota. Ex post siempre muestra los resultados.</small>
        </span>
      </label>
      {stages && (
        <div className="quick-modules" role="group" aria-label="Módulos a jugar">
          {quickModules.map((m) => (
            <label key={m.phase} className={"quick-module" + (stages.includes(m.phase) ? " on" : "")}>
              <input type="checkbox" checked={stages.includes(m.phase)} onChange={() => toggle(m.phase)} />
              <span>
                <b>
                  {String(m.phase + 1).padStart(2, "0")} · {m.name}
                </b>
                <small>{m.topic}</small>
              </span>
            </label>
          ))}
          <p className={"quick-summary" + (stages.length ? "" : " alerta")} role="status">
            {!stages.length
              ? "Elige al menos un módulo."
              : stages.length === 7
                ? "Elegiste los siete módulos: se jugará una partida completa."
                : `Jugarás ${stages.length} de 7 módulos; ${7 - stages.length} se resolverán automáticamente.`}
          </p>
        </div>
      )}
    </fieldset>
  );
}
