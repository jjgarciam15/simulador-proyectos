import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { playerDataKeys, resetPlayerData, verifyZeroState } from "../../domain/project/store";
import { scenarios } from "../../data/scenarios";
import { Button } from "../../components/ui";

const verifyKey = "proyecta-reset-verify";
/**
 * RESTABLECER PARTIDAS / PREPARAR SIMULADOR PARA COMPARTIR.
 * Deletes only player data (games, scores, answers, progress, logs, imported and manual projects, drafts,
 * exam attempts). Official missions, content, assets, preferences, methodologies and the Learning Center stay.
 */
export function ResetDialog({ onClose }: { onClose: () => void }) {
  const [typed, setTyped] = useState(""),
    [share, setShare] = useState(false);
  const keys = playerDataKeys(localStorage);
  return (
    <div className="reset-dialog">
      <p className="reset-warning">
        <AlertTriangle size={18} aria-hidden /> Esta acción no se puede deshacer.
      </p>
      <h4>Se borrará</h4>
      <ul>
        <li>Partidas en curso, en pausa y terminadas, con sus puntuaciones, respuestas, progreso y bitácoras.</li>
        <li>Proyectos importados, proyectos creados, borradores y partidas generadas.</li>
        <li>Intentos del Examen 2.</li>
      </ul>
      <h4>Se conserva</h4>
      <ul>
        <li>Las {scenarios.length} misiones oficiales, su contenido e ilustraciones.</li>
        <li>Metodologías, Centro de aprendizaje, configuración de sonido y animación, y el código de la aplicación.</li>
      </ul>
      <p className="muted">Datos del jugador encontrados en este navegador: {keys.length} registro(s).</p>
      <label className="checkline">
        <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} /> Preparar el simulador para compartir (dejarlo en estado cero y verificarlo al recargar)
      </label>
      <label className="field">
        <span>
          Escribe <strong>RESTABLECER</strong> para confirmar
        </span>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" aria-label="Confirmación" />
      </label>
      <div className="actions">
        <Button
          disabled={typed !== "RESTABLECER"}
          onClick={() => {
            resetPlayerData(localStorage);
            try {
              sessionStorage.setItem(verifyKey, share ? "compartir" : "restablecer");
            } catch {
              /* verification banner is optional */
            }
            window.location.reload();
          }}
        >
          {share ? "PREPARAR SIMULADOR PARA COMPARTIR" : "RESTABLECER PARTIDAS"}
        </Button>
        <Button secondary onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
/** After the reload: checks the zero state and reports it. */
export function ResetVerification({ games, projects }: { games: number; projects: number }) {
  const [flag] = useState(() => {
    try {
      const v = sessionStorage.getItem(verifyKey);
      sessionStorage.removeItem(verifyKey);
      return v;
    } catch {
      return null;
    }
  });
  const [open, setOpen] = useState(true);
  if (!flag || !open) return null;
  const z = verifyZeroState(localStorage);
  const ok = !z.leftovers.length && z.generated === 0 && games === 0 && projects === 0;
  return (
    <div role="status" className={"reset-verify " + (ok ? "ok" : "error")}>
      {ok ? <CheckCircle2 size={18} aria-hidden /> : <AlertTriangle size={18} aria-hidden />}
      <div>
        <strong>{flag === "compartir" ? "Simulador listo para compartir" : "Partidas restablecidas"}</strong>
        <span>
          Verificado tras recargar: {games} partidas · {projects} proyectos personales o importados · {z.generated} misiones generadas · {z.leftovers.length} registros de progreso restantes. Misiones oficiales intactas: {scenarios.length}.
        </span>
      </div>
      <button type="button" className="text-btn" onClick={() => setOpen(false)}>
        Cerrar
      </button>
    </div>
  );
}
