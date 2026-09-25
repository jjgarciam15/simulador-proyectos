import { Trophy, Flag } from "lucide-react";
import {
  challenges,
  challengeProgress,
  type Challenge,
} from "../domain/challenges";
import type { GameState } from "../domain/types";
import { Panel, Button } from "../components/ui";
import { scenarioById } from "../data/scenarios";
import { difficultyRules } from "../data/balance";

export function ChallengeCatalog({
  onStart,
}: {
  onStart: (c: Challenge) => void;
}) {
  return (
    <section className="challenge-catalog">
      <div className="eyebrow">ENCARGOS ESPECIALES DEL CONSEJO</div>
      <h2>Reconstruye bajo presión.</h2>
      <p>
        Retos con condiciones fijas, menos orientación y objetivos MGA. Tu
        partida actual quedará en pausa.
      </p>
      <div className="challenge-grid">
        {challenges.map((c) => (
          <Panel
            key={c.id}
            title={c.title}
            kicker={`MODO RETO · ${c.difficulty}`}
          >
            <p>
              {scenarioById(c.scenarioId).title}.{" "}
              {c.noCredit
                ? "Crédito deshabilitado; cofinanciación sujeta a los requisitos del escenario."
                : `Fondo inicial reducido un ${Math.round((1 - difficultyRules[c.difficulty].cash) * 100)} % y eventos más severos; financiación habitual disponible.`}
            </p>
            <ul>
              <li>Completa el proyecto sin incumplimiento.</li>
              <li>Cadena de valor al invertir: mínimo {c.minimumChain}/100.</li>
              <li>Cobertura final: mínimo {c.minimumCoverage} %.</li>
              <li>Evaluación final: mínimo {c.minimumScore}/100.</li>
            </ul>
            <small>
              Condiciones reproducibles: {c.seed}. Las ayudas siguen
              disponibles.
            </small>
            <Button onClick={() => onStart(c)}>
              <Flag size={16} />
              Aceptar reto: {c.title}
            </Button>
          </Panel>
        ))}
      </div>
    </section>
  );
}
export function ChallengeStatus({ g }: { g: GameState }) {
  const progress = challengeProgress(g);
  if (!progress) return null;
  return (
    <details className="challenge-status" open={!!g.outcome}>
      <summary>
        <Trophy size={19} />
        <span>
          {progress.won
            ? "Distinción: formulador bajo presión"
            : g.outcome
              ? "Reto cerrado · revisa tus evidencias"
              : "Reto activo"}{" "}
          · {progress.challenge.title}
        </span>
      </summary>
      <p>
        {progress.challenge.noCredit
          ? "Crédito deshabilitado durante toda la partida. "
          : "Financiación habitual disponible. "}
        La distinción exige cumplir todos los objetivos; no añade puntos ni
        recursos.
      </p>
      <ul>
        {progress.goals.map((goal) => (
          <li key={goal.label}>
            <span>
              {goal.met ? "✓" : "○"} {goal.label}
            </span>
            <strong>{goal.value}</strong>
          </li>
        ))}
      </ul>
      <small>
        La cadena se evalúa con la fotografía de inversión. Cobertura y nota se
        verifican al cierre. Reintentar conserva reglas y semilla.
      </small>
    </details>
  );
}
