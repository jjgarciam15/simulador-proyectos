import type { GameState } from "../../domain/types";
import { distribution } from "../../domain/comparison";
import { fmtSignedMoney } from "../../domain/format";
import { Panel } from "../../components/ui";

/** ¿Quién gana y quién pierde? Present values by group, derived from valuations and the cash flow. */
export default function Distribution({ g }: { g: GameState }) {
  const rows = distribution(g),
    max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  if (!rows.length) return null;
  return (
    <Panel title="¿Quién gana y quién pierde?" kicker="EVALUACIÓN DISTRIBUTIVA">
      <p className="muted">
        Valor presente al 9 % por grupo. Los impactos valorados se asignan a quien los recibe; las tarifas pasan de los usuarios al operador; la inversión y la
        operación las financia quien ejecuta. Las transferencias cambian quién gana, no el total de la sociedad.
      </p>
      <div className="v22-bars" role="list">
        {rows.map((r) => (
          <div key={r.group} role="listitem" className={r.value >= 0 ? "gain" : "loss"}>
            <span>{r.group}</span>
            <div>
              <i style={{ width: (Math.abs(r.value) / max) * 100 + "%" }} />
            </div>
            <strong>
              {r.value >= 0 ? "▲ gana " : "▼ pierde "}
              {fmtSignedMoney(r.value)}
            </strong>
          </div>
        ))}
      </div>
      <p className="muted">Conecta con actores (apoyo y oposición), regulación (tarifas y subsidios) y bienestar: un proyecto con VPN positivo puede concentrar costos en un grupo.</p>
    </Panel>
  );
}
