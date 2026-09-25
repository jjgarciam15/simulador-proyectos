import { useState } from "react";
import type { GameState } from "../domain/types";
import type { Action } from "../domain/engine";
import { scenarioById } from "../data/scenarios";
import { money } from "../domain/finance";
import { Button } from "../components/ui";

export default function ResetStage({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  if (!g.v2 || g.snapshot || g.outcome || g.phase > 4) return null;
  const detail = [
    "Se vacían el árbol del problema, sus conexiones y la clasificación de actores; la población vuelve a la afectada.",
    "Se vacían objetivo, alternativa y comparaciones. El presupuesto y el cronograma posteriores se conservan para revisión.",
    "Se vacían cadena de valor, presupuesto, cronograma e indicadores.",
    "Se retiran la confirmación de evaluación, la hipótesis y el supuesto escrito. Se conservan los parámetros económicos.",
    "Se vuelve a no intervenir y se vacían diagnóstico regulatorio, argumentos y alineación ODS.",
  ][g.phase];
  return (
    <details className="reset-stage">
      <summary>Rehacer esta etapa</summary>
      <p>
        {detail} Los estudios pagados, acuerdos, financiación, intentos y gastos
        se conservan; no hay reembolsos. Las etapas dependientes quedarán
        pendientes de revisión.
      </p>
      <p>
        {g.v2.completed.includes(g.phase)
          ? `Costo de reformulación: ${money(scenarioById(g.scenarioId).budget * 0.002)} y un mes.`
          : "Esta etapa aún no se ha completado: reiniciar su borrador no cuesta recursos."}
      </p>
      {confirm ? (
        <div role="alert">
          <p>
            ¿Confirmas reiniciar únicamente esta etapa? También se descartarán
            sus cambios sin guardar.
          </p>
          <Button secondary onClick={() => setConfirm(false)}>
            Conservar trabajo
          </Button>
          <Button
            onClick={() => {
              send({ type: "resetStage" });
              setConfirm(false);
            }}
          >
            Confirmar reinicio de etapa
          </Button>
        </div>
      ) : (
        <Button secondary onClick={() => setConfirm(true)}>
          Preparar reinicio de etapa
        </Button>
      )}
    </details>
  );
}
