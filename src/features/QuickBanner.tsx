import { Zap } from "lucide-react";
import { phases } from "../domain/types";
import type { GameState } from "../domain/types";

/** Reminder during a quick game: which modules the player plays and that the rest arrive solved. */
export default function QuickBanner({ g }: { g: GameState }) {
  const stages = g.v2!.quick!.stages,
    auto = phases.slice(0, 7).filter((_, i) => !stages.includes(i));
  return (
    <div className="quick-banner" role="note">
      <Zap size={18} aria-hidden />
      <p>
        <strong>Partida rápida.</strong> Juegas {stages.map((p) => phases[p]).join(", ")}. {auto.join(", ")} {auto.length === 1 ? "llega resuelta" : "llegan resueltas"} con la solución de referencia (consúltala en la Bitácora) y no {auto.length === 1 ? "cuenta" : "cuentan"} en la nota.
      </p>
    </div>
  );
}
