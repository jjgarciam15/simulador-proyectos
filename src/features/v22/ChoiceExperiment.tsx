import { useState } from "react";

/**
 * Mini experimento de elección: the player chooses between two routes that differ in time and fare.
 * The implied value of a minute is the fare difference divided by the time difference of the accepted trade-offs.
 * A real study estimates it with an econometric model over many respondents.
 */
const sets = [
  { a: { minutes: 40, fare: 2000 }, b: { minutes: 30, fare: 2600 } },
  { a: { minutes: 35, fare: 2200 }, b: { minutes: 25, fare: 3400 } },
  { a: { minutes: 45, fare: 1800 }, b: { minutes: 35, fare: 2100 } },
];
export default function ChoiceExperiment() {
  const [answers, setAnswers] = useState<("a" | "b")[]>([]);
  const i = answers.length,
    done = i === sets.length;
  const paid = answers.map((x, k) => ({ x, ...sets[k] })).filter((r) => r.x === "b");
  const refused = answers.map((x, k) => ({ x, ...sets[k] })).filter((r) => r.x === "a");
  const perMinute = (r: (typeof sets)[number]) => (r.b.fare - r.a.fare) / (r.a.minutes - r.b.minutes);
  const low = paid.length ? Math.max(...paid.map(perMinute)) : 0,
    high = refused.length ? Math.min(...refused.map(perMinute)) : null;
  return (
    <div className="v22-experiment">
      <h4>Prueba un experimento de elección</h4>
      <p className="muted">Elige la ruta que usarías. Cada par combina tiempo de viaje y tarifa: tus elecciones revelan cuánto vale para ti un minuto.</p>
      {!done ? (
        <div className="two-col">
          {(["a", "b"] as const).map((k) => (
            <button key={k} className="v22-option" onClick={() => setAnswers([...answers, k])}>
              <strong>Ruta {k.toUpperCase()}</strong>
              <span>{sets[i][k].minutes} minutos</span>
              <span>Tarifa $ {sets[i][k].fare.toLocaleString("es-CO")}</span>
            </button>
          ))}
        </div>
      ) : (
        <div role="status">
          <p>
            Tus elecciones indican que un minuto ahorrado vale para ti al menos $ {Math.round(low).toLocaleString("es-CO")}
            {high !== null && high > low ? ` y menos de $ ${Math.round(high).toLocaleString("es-CO")}` : ""}.
          </p>
          <p className="muted">
            Atributos: tiempo y tarifa. Niveles: los valores de cada ruta. La valoración implícita surge de los trade-offs que aceptas. Con muchas personas y un
            modelo econométrico se estima la disposición a pagar por cada atributo.
          </p>
          <button className="text-btn" onClick={() => setAnswers([])}>
            Repetir
          </button>
        </div>
      )}
    </div>
  );
}
