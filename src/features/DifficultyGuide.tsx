import type { Difficulty } from "../domain/types";
import { difficultyRules, regulationBalance } from "../data/balance";

const initialInformation: Record<Difficulty, number> = { guiado: 40, profesional: 25, experto: 12 };
const summary: Record<Difficulty, string> = {
  guiado: "Más orientación, pistas baratas y retroalimentación completa. Ideal para aprender el método.",
  profesional: "Restricciones moderadas: debes analizar más y las ayudas cuestan más.",
  experto: "Escasez fuerte, poca información, eventos exigentes y retroalimentación mínima: la coherencia lo es todo.",
};
const feedback = { full: "Explica cada error", cards: "Señala qué falla, sin explicar", score: "Solo muestra la nota" };

/** Difficulty selector with the real differences, read from the centralized balance rules. */
export default function DifficultyGuide({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}) {
  const ids = Object.keys(difficultyRules) as Difficulty[];
  return (
    <div className="difficulty-guide">
      <div className="difficulty-list">
        {ids.map((id) => (
          <button className={value === id ? "chosen" : ""} key={id} aria-pressed={value === id} onClick={() => onChange(id)}>
            <strong>{difficultyRules[id].label}</strong>
            <small>{summary[id]}</small>
          </button>
        ))}
      </div>
      <details>
        <summary>Comparar modos en detalle</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Qué cambia</th>
                {ids.map((id) => (
                  <th key={id}>{difficultyRules[id].label.split(" · ")[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Fondo inicial</td>
                {ids.map((id) => (
                  <td key={id}>{Math.round(difficultyRules[id].cash * 100)} % del presupuesto base</td>
                ))}
              </tr>
              <tr>
                <td>Información inicial</td>
                {ids.map((id) => (
                  <td key={id}>{initialInformation[id]}/100</td>
                ))}
              </tr>
              <tr>
                <td>Incertidumbre regulatoria sin estudio</td>
                {ids.map((id) => (
                  <td key={id}>± {regulationBalance.uncertainty.unstudied[id].toFixed(2)}</td>
                ))}
              </tr>
              <tr>
                <td>Probabilidad de eventos y dilemas</td>
                {ids.map((id) => (
                  <td key={id}>× {difficultyRules[id].event}</td>
                ))}
              </tr>
              <tr>
                <td>Costo de las decisiones en dilemas</td>
                {ids.map((id) => (
                  <td key={id}>× {difficultyRules[id].dilemmaCost}</td>
                ))}
              </tr>
              <tr>
                <td>Penalización por pista</td>
                {ids.map((id) => (
                  <td key={id}>{difficultyRules[id].hintPenalty} punto(s) del ejercicio</td>
                ))}
              </tr>
              <tr>
                <td>Retroalimentación de la cadena y el puzzle</td>
                {ids.map((id) => (
                  <td key={id}>{feedback[difficultyRules[id].feedback]}</td>
                ))}
              </tr>
              <tr>
                <td>Aviso de consecuencias diferidas</td>
                {ids.map((id) => (
                  <td key={id}>{id === "guiado" ? "Se indica que existen" : "No se anticipan"}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted">
          La realidad subyacente (demanda, costos técnicos, severidad de la falla) depende solo del código de condiciones: la
          dificultad cambia lo que sabes, lo que tienes y cuánto te cuestan los errores.
        </p>
      </details>
    </div>
  );
}
