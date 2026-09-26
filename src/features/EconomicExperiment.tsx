import { useState } from "react";
import type { GameState } from "../domain/types";
import { model, selected } from "../domain/engine";
import { discountExperiment } from "../domain/learning";
import { Panel, Button, Field } from "../components/ui";

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
