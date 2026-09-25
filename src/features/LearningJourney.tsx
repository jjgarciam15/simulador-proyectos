import { useState } from "react";
import { BookOpen, Compass, CheckCircle2 } from "lucide-react";
import type { GameState } from "../domain/types";
import { model, selected, type Action } from "../domain/engine";
import {
  learningChallenges,
  learningSummary,
  discountExperiment,
} from "../domain/learning";
import { Panel, Button, Field } from "../components/ui";

export default function LearningJourney({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const all = learningChallenges(g),
    summary = learningSummary(g);
  const [reviewPhase, setReviewPhase] = useState(g.phase),
    [transfer, setTransfer] = useState(false);
  const c = all.find(
    (c) => c.phase === reviewPhase && c.transfer === transfer,
  )!;
  const attempt = g.learning?.find((a) => a.id === c.id);
  const first = g.learning?.some(
    (a) => a.id === `aprendizaje-v1-${reviewPhase}-caso`,
  );
  return (
    <Panel
      className="learning-journey"
      title="Tu misión de criterio"
      kicker="APRENDE → CONTRASTA → APLICA"
    >
      <div className="learning-header">
        <BookOpen />
        <p>
          El Consejo necesita tu razonamiento. Practica antes de decidir;
          equivocarte aquí no cuesta recursos.
        </p>
        <strong>
          {summary.attempts.length}/{summary.total} casos
        </strong>
      </div>
      <details className="learning-route">
        <summary>Mi ruta de aprendizaje y conceptos por repasar</summary>
        <p>
          Primeros casos: {summary.initial.correct}/{summary.initial.answered}{" "}
          aciertos. Aplicación en casos distintos: {summary.transfer.correct}/
          {summary.transfer.answered}. Son evidencias de práctica, no una
          medición validada de aprendizaje.
        </p>
        <div className="learning-topics">
          {all
            .filter((c) => !c.transfer)
            .map((topic) => (
              <button
                key={topic.id}
                disabled={topic.phase > g.phase}
                onClick={() => {
                  setReviewPhase(topic.phase);
                  setTransfer(false);
                }}
                aria-pressed={reviewPhase === topic.phase}
              >
                {topic.phase + 1}. {topic.topic}
              </button>
            ))}
        </div>
        {summary.review.length > 0 && (
          <p>
            Repasa:{" "}
            {[...new Set(summary.review.map((a) => a.topic))].join(" · ")}.{" "}
            {summary.overconfident > 0 &&
              `${summary.overconfident} respuestas incorrectas se marcaron con seguridad: revisa qué evidencia faltaba.`}
          </p>
        )}
        <p>
          Las respuestas se conservan al recargar y no se sustituyen repitiendo
          el mismo caso. El resultado económico del proyecto permanece separado.
        </p>
      </details>
      <div className="learning-rounds">
        <Button
          secondary
          onClick={() => setTransfer(false)}
          disabled={!transfer}
        >
          1. Caso inicial
        </Button>
        <Button
          secondary
          onClick={() => setTransfer(true)}
          disabled={!first || transfer}
        >
          2. Aplicar en otro caso
        </Button>
      </div>
      <h4>
        {c.topic} · {c.transfer ? "Nueva situación" : "Decisión del Consejo"}
      </h4>
      <LearningQuestion
        key={g.id + c.id}
        question={c.question}
        options={c.options}
        disabled={!!attempt}
        savedChoice={attempt?.choice}
        onAnswer={(choice, confidence) =>
          send({ type: "learn", id: c.id, choice, confidence })
        }
      />
      {attempt && (
        <div
          className={
            "learning-feedback " + (attempt.correct ? "understood" : "revisit")
          }
          role="status"
        >
          <strong>
            {attempt.correct
              ? "Criterio aplicado"
              : "Hay una distinción para repasar"}
          </strong>
          <p>
            Tu elección: {c.options.find((o) => o.id === attempt.choice)?.text}
          </p>
          <p>{c.options.find((o) => o.id === attempt.choice)?.feedback}</p>
          <p>
            <Compass size={17} /> Ahora en tu proyecto: {c.application}
          </p>
          {!transfer && (
            <Button onClick={() => setTransfer(true)}>
              Probar en otra situación →
            </Button>
          )}
          {transfer && (
            <p>
              <CheckCircle2 size={17} /> Práctica de esta etapa registrada.
              Lleva este criterio a las herramientas del proyecto.
            </p>
          )}
        </div>
      )}
      <details className="learning-source">
        <summary>MGA, normas y reglas del juego</summary>
        <p>
          Referentes para estudiar: artículo 343 de la Constitución, artículo 49
          de la Ley 152 de 1994 y Resolución 1450 de 2013, identificados en los
          lineamientos conceptuales del DNP. Explican el fundamento de la
          metodología; no son una lista exhaustiva de requisitos del proyecto.
        </p>
        <a
          href="https://mgaayuda.dnp.gov.co/Recursos/Documento_conceptual_2023.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Consultar fundamento y metodología · DNP, 2023
        </a>
        <p>
          MGA es una metodología del DNP; MGA Web es una herramienta para
          registrar proyectos. Las ocho etapas de Aurora son una adaptación
          didáctica, no ocho módulos oficiales. En escenarios privados se
          practican conceptos de evaluación; no se afirma que todo proyecto
          privado deba usar MGA.
        </p>
        <p>
          La regulación económica del servicio es distinta de los requisitos
          jurídicos para formular y ejecutar una inversión. Los permisos y
          competencias deben examinarse para cada proyecto; este simulador no
          emite un concepto de viabilidad.
        </p>
        <a
          href="https://www.dnp.gov.co/LaEntidad_/subdireccion-general-inversiones-seguimiento-evaluacion/direccion-proyectos-informacion-para-inversion-publica/Paginas/metodologia-general-ajustada-mga.aspx"
          target="_blank"
          rel="noreferrer"
        >
          Metodología MGA · DNP
        </a>
        {" · "}
        <a
          href="https://dnp.gov.co/LaEntidad_/subdireccion-general-inversiones-seguimiento-evaluacion/direccion-proyectos-informacion-para-inversion-publica/Paginas/normatividad-vigente.aspx"
          target="_blank"
          rel="noreferrer"
        >
          Normatividad publicada por DNP
        </a>
        <p>
          Referencias revisadas el 13 de septiembre de 2026. Las consultas
          externas son opcionales; la práctica funciona sin conexión.
        </p>
      </details>
    </Panel>
  );
}
function LearningQuestion({
  question,
  options,
  disabled,
  savedChoice,
  onAnswer,
}: {
  question: string;
  options: { id: string; text: string }[];
  disabled: boolean;
  savedChoice?: string;
  onAnswer: (choice: string, confidence: "seguro" | "duda") => void;
}) {
  const [choice, setChoice] = useState(""),
    [confidence, setConfidence] = useState<"seguro" | "duda">("duda");
  return (
    <>
      <fieldset disabled={disabled} className="learning-choices">
        <legend>{question}</legend>
        {options.map((o) => (
          <label key={o.id}>
            <input
              type="radio"
              name="learning-choice"
              value={o.id}
              checked={(savedChoice ?? choice) === o.id}
              onChange={() => setChoice(o.id)}
            />
            <span>{o.text}</span>
          </label>
        ))}
      </fieldset>
      {!disabled && (
        <div className="learning-answer">
          <Field label="¿Qué tan seguro estás?">
            <select
              value={confidence}
              onChange={(e) =>
                setConfidence(e.target.value as "seguro" | "duda")
              }
            >
              <option value="duda">Estoy razonando con dudas</option>
              <option value="seguro">Puedo defender mi respuesta</option>
            </select>
          </Field>
          <Button
            disabled={!choice}
            onClick={() => onAnswer(choice, confidence)}
          >
            Confirmar razonamiento
          </Button>
        </div>
      )}
    </>
  );
}
export function EconomicExperiment({ g }: { g?: GameState }) {
  const [prediction, setPrediction] = useState(""),
    [revealed, setRevealed] = useState(false),
    [rate, setRate] = useState(10),
    [delay, setDelay] = useState(0);
  const result = discountExperiment(100, 60, rate / 100, delay),
    base = discountExperiment(100, 60, 0.1, 0);
  const actual = g && selected(g) ? model(g) : null;
  const delayed =
    g && selected(g)
      ? model(g, selected(g), false, { delay: g.assumptions.delay + 12 })
      : null;
  return (
    <Panel
      title="Laboratorio económico · el tiempo también cuesta"
      kicker="EXPERIMENTO SIN GASTAR RECURSOS"
    >
      <p>
        Microcaso independiente: inversión de 100 M COP hoy y dos flujos netos
        de 60 M COP al cierre de los años 1 y 2. Precios constantes, sin
        inflación, financiación ni valor residual. Tasa educativa del 10 %, no
        una tasa oficial.
      </p>
      <Field label="Predice: si los dos cobros se retrasan un año y la inversión se mantiene hoy, el VPN…">
        <select
          value={prediction}
          disabled={revealed}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="">Elige una predicción</option>
          <option value="lower">Disminuye</option>
          <option value="same">No cambia</option>
          <option value="higher">Aumenta</option>
        </select>
      </Field>
      {!revealed ? (
        <Button
          disabled={!prediction}
          onClick={() => {
            setRevealed(true);
            setDelay(1);
          }}
        >
          Ejecutar experimento
        </Button>
      ) : (
        <>
          <p role="status">
            {prediction === "lower"
              ? "Tu predicción coincide."
              : "Contrasta tu predicción con los flujos descontados."}{" "}
            Con tasa positiva, recibir lo mismo más tarde reduce su valor
            presente.
          </p>
          <div className="two-col">
            <Field label={`Tasa real: ${rate} %`}>
              <input
                aria-label="Tasa real del experimento"
                type="range"
                min="0"
                max="30"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
            </Field>
            <Field label={`Retraso de los cobros: ${delay} años`}>
              <input
                aria-label="Retraso del experimento"
                type="range"
                min="0"
                max="3"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="learning-vpn" aria-live="polite">
            <strong>VPN: {result.value.toFixed(2)} M COP</strong>
            <span>
              Referencia inicial: {base.value.toFixed(2)} M COP · Diferencia:{" "}
              {(result.value - base.value).toFixed(2)} M COP
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Año</th>
                  <th>Flujo neto · M COP</th>
                  <th>Valor presente · M COP</th>
                </tr>
              </thead>
              <tbody>
                {result.terms.map((t) => (
                  <tr key={t.year}>
                    <td>{t.year}</td>
                    <td>{t.flow}</td>
                    <td>{t.present.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            VPN = Σ flujo del año t / (1 + tasa)ᵗ. Prueba tasa cero: el tiempo
            deja de cambiar el VPN, aunque el retraso todavía puede afectar la
            prestación del servicio. Estos controles no modifican los supuestos
            de tu partida.
          </p>
          {actual && delayed && (
            <div className="learning-feedback">
              <h4>Puente con tu proyecto: un año adicional de retraso</h4>
              <p>
                Con tu alternativa y supuestos confirmados, el VPN financiero
                pasa de{" "}
                {actual.financial.npv.toLocaleString("es-CO", {
                  maximumFractionDigits: 1,
                })}{" "}
                a{" "}
                {delayed.financial.npv.toLocaleString("es-CO", {
                  maximumFractionDigits: 1,
                })}{" "}
                M COP; el VPN social, de{" "}
                {actual.social.npv.toLocaleString("es-CO", {
                  maximumFractionDigits: 1,
                })}{" "}
                a{" "}
                {delayed.social.npv.toLocaleString("es-CO", {
                  maximumFractionDigits: 1,
                })}{" "}
                M COP.
              </p>
              <p>
                Comparación calculada con el motor de tu partida, manteniendo
                los demás supuestos. No confirma cambios ni revela las
                condiciones ocultas. El efecto neto depende de todos los flujos
                que se desplazan, incluidos los costos operativos.
              </p>
            </div>
          )}
          <p>
            <strong>Ahora aplica:</strong> vuelve a los flujos del proyecto.
            ¿Qué sucede con la viabilidad si se retrasa la entrada en operación?
            ¿El mismo efecto sobre caja implica el mismo efecto sobre bienestar?
          </p>
        </>
      )}
    </Panel>
  );
}
