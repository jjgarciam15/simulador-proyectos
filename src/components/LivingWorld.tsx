import { useState } from "react";
import type { GameState } from "../domain/types";
import { assets, missions, nationProgress } from "../data/world";
import { scenarios } from "../data/scenarios";
import { act, type Action } from "../domain/engine";
import { money } from "../domain/finance";

export function TerritoryMap({
  history,
  onChoose,
}: {
  history: GameState[];
  onChoose: (id: string) => void;
}) {
  const { best } = nationProgress(history);
  const [focus, setFocus] = useState("agua");
  const mission = missions[focus];
  return (
    <section className="territory-map" aria-label="Mapa de misiones de Aurora">
      <div className="map-canvas">
        <img src={assets.nation} alt="Maqueta ilustrada de Aurora" />
        <div className="map-grid" />
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            className={
              "map-pin " +
              (focus === s.id ? "selected " : "") +
              (best[s.id] ? "rebuilt" : "")
            }
            style={{
              left: missions[s.id].position[0] + "%",
              top: missions[s.id].position[1] + "%",
            }}
            aria-label={missions[s.id].district}
            aria-pressed={focus === s.id}
            onClick={() => setFocus(s.id)}
          >
            {String(i + 1).padStart(2, "0")}
          </button>
        ))}
        <span className="map-caption">
          MAPA ILUSTRADO · SELECCIONA UN DISTRITO
        </span>
      </div>
      <div className="map-dispatch" key={focus}>
        <span className="eyebrow">RADIO DEL CONSEJO</span>
        <h2>{mission.district}</h2>
        <p>{mission.hook}</p>
        <p className="dispatch-stakes">{mission.stakes}</p>
        <button className="dispatch-button" onClick={() => onChoose(focus)}>
          Recibir esta misión →
        </button>
        <small>
          {best[focus]
            ? Math.round(best[focus].outcome!.coverage * 100) +
              " % de cobertura en tu mejor resultado"
            : "Distrito pendiente de reconstrucción"}
        </small>
      </div>
    </section>
  );
}

export function ReconstructionScene({
  g,
  progress,
}: {
  g: GameState;
  progress: number;
}) {
  const step = progress < 0.25 ? 0 : progress < 0.6 ? 1 : progress < 1 ? 2 : 3;
  return (
    <div className={"reconstruction-scene scene-step-" + step}>
      <img
        src={assets.nation}
        alt="Ilustración ambiental de Aurora; el avance real se indica en la barra de ejecución"
      />
      <div className="scene-weather" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <span className="scene-beacon" aria-hidden="true" />
      <div className="scene-caption" key={step}>
        <span>{missions[g.scenarioId].district}</span>
        <strong>
          {
            [
              "El terreno espera tu proyecto",
              "La reconstrucción toma forma",
              "Preparando la puesta en servicio",
              "Un nuevo capítulo para Aurora",
            ][step]
          }
        </strong>
        <small>
          Vista narrativa · {Math.round(progress * 100)} % de ejecución
          {g.pendingEvent ? " · El equipo espera tu decisión" : ""}
        </small>
      </div>
    </div>
  );
}

type Choice = Extract<Action, { type: "respond" }>["choice"];
const responses: [Choice, string, string][] = [
  ["continuar", "Seguir el plan", "Aceptar las nuevas condiciones."],
  [
    "mitigar",
    "Proteger el proyecto",
    "Reducir las consecuencias con una intervención.",
  ],
  [
    "redimensionar",
    "Reducir el alcance",
    "Preservar caja sacrificando desempeño.",
  ],
  [
    "aplazar",
    "Esperar mejores condiciones",
    "Ganar margen de caja a costa del plazo.",
  ],
  [
    "tecnologia",
    "Adaptar la tecnología",
    "Invertir en capacidad de respuesta.",
  ],
  ["renegociar", "Volver a la mesa", "Reducir costos y revisar los acuerdos."],
];
export function EventChoices({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const options = responses.map(([id, title, description]) => {
    try {
      const next = act(g, { type: "respond", choice: id }, false);
      return {
        id,
        title,
        description,
        cost: next.extraCost - g.extraCost,
        delay: next.delay - g.delay,
        performance: next.performance - g.performance,
        support: next.support - g.support,
        error: "",
      };
    } catch (error) {
      return {
        id,
        title,
        description,
        cost: 0,
        delay: 0,
        performance: 0,
        support: 0,
        error:
          error instanceof Error ? error.message : "Respuesta no disponible",
      };
    }
  });
  const picked = options.find((o) => o.id === choice);
  return (
    <>
      <div className="response-grid">
        {options.map((o) => (
          <button
            key={o.id}
            className={
              "response " + (choice === o.id ? "response-selected" : "")
            }
            aria-pressed={choice === o.id}
            onClick={() => setChoice(o.id)}
          >
            <h4>{o.title}</h4>
            <p>{o.description}</p>
            {o.error ? (
              <small>{o.error}</small>
            ) : (
              <div className="response-cost">
                $ {money(o.cost)} · +{o.delay} meses
              </div>
            )}
          </button>
        ))}
      </div>
      {picked && (
        <div className="response-preview" role="status">
          <h4>{picked.title}</h4>
          {picked.error ? (
            <p>
              {picked.error} Puedes revisar la financiación antes de responder.
            </p>
          ) : (
            <>
              <p>
                Costo: <strong>$ {money(picked.cost)}</strong> · Retraso
                adicional: <strong>{picked.delay} meses</strong>
              </p>
              <p>
                Desempeño: {picked.performance >= 0 ? "+" : ""}
                {Math.round(picked.performance * 100)} puntos · Apoyo:{" "}
                {picked.support >= 0 ? "+" : ""}
                {picked.support} puntos
              </p>
              <button
                onClick={() => {
                  send({ type: "respond", choice: picked.id });
                  setChoice(null);
                }}
              >
                Confirmar respuesta →
              </button>
            </>
          )}
          <small>
            Seleccionar una tarjeta no gasta recursos. Confirmar registra la
            decisión.
          </small>
        </div>
      )}
    </>
  );
}
