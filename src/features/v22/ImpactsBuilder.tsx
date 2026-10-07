import { useState } from "react";
import type { GameState } from "../../domain/types";
import type { Action } from "../../domain/engine";
import type { Beneficiary, ImpactKind } from "../../data/impacts";
import { impactCards, impactReview, kindText, type ImpactPlacement } from "../../domain/valuation";
import { helpPolicy } from "../../domain/help";
import { Panel, Button } from "../../components/ui";
import { useDraftGuard, different } from "../../components/workbench";
import { Deferred, ModuleIntro, Status } from "./common";
import { fb, FeedbackLegend, type FeedbackLevel } from "../../components/feedback";

const kinds = Object.keys(kindText) as ImpactKind[];
const groups: Beneficiary[] = ["Usuarios", "Consumidores", "Productores", "Gobierno", "Comunidad", "Trabajadores", "Población objetivo", "Terceros"];

/** Nueva etapa: efectos e impactos. Separates problem effects from project effects and asks who receives each impact. */
export default function ImpactsBuilder({ g, send }: { g: GameState; send: (a: Action) => void }) {
  const cards = impactCards(g),
    saved = g.v2!.v22!.impacts?.placements ?? [],
    [placements, setPlacements] = useState<ImpactPlacement[]>(saved),
    [over, setOver] = useState(""),
    help = helpPolicy(g);
  useDraftGuard(different(placements, saved));
  const place = (id: string, patch: Partial<ImpactPlacement>) => {
    const prior = placements.find((p) => p.id === id);
    const next = {
      id,
      kind: (patch.kind ?? prior?.kind ?? "efecto") as ImpactKind,
      group: patch.group ?? prior?.group,
    };
    setPlacements([...placements.filter((p) => p.id !== id), next]);
  };
  const review = impactReview(g),
    marks = saved.length > 0 && help.immediate && help.detail !== "score";
  /** Color and hover text of a card, only while it stays as it was confirmed. */
  function feedbackOf(id: string): { level: FeedbackLevel; text: string } | null {
    const r = marks ? review.rows.find((x) => x.card.id === id) : undefined,
      now = placements.find((x) => x.id === id);
    if (!r?.placed || !now || now.kind !== r.placed.kind || now.group !== r.placed.group) return null;
    const right = `${kindText[r.card.kind].toLowerCase()}${r.card.group && (r.card.kind === "impactoPositivo" || r.card.kind === "impactoNegativo") ? `, recibido por ${r.card.group}` : ""}`;
    if (r.status === "correcta")
      return {
        level: "ok",
        text: help.detail === "full" ? `Bien clasificada: ${right}. ${r.card.why}` : "Bien clasificada.",
      };
    const status = r.status.charAt(0).toUpperCase() + r.status.slice(1);
    return {
      level: r.status === "grupo incorrecto" ? "alerta" : "grave",
      text: `${status}.${help.detail === "full" ? ` Corresponde a ${right}. ${r.card.why}` : ""}`,
    };
  }
  const levels = cards.map((c) => feedbackOf(c.id)?.level).filter((x): x is FeedbackLevel => !!x),
    count = (k: FeedbackLevel) => levels.filter((x) => x === k).length;
  return (
    <Panel title="Efectos e impactos del proyecto" kicker="PRODUCTO → EFECTO → IMPACTO">
      <ModuleIntro
        concepts={["efectos-impactos", "doble-conteo"]}
        what="Tu alternativa entrega productos; esos productos generan efectos, y los efectos producen impactos positivos o negativos."
        why="Solo lo que el proyecto cambia se mide y se valora. Un efecto del problema describe la situación actual, no un cambio."
        decide="Clasifica cada tarjeta y, para los impactos, identifica quién los recibe."
        next="Valoración económica, flujo económico, evaluación distributiva y ODS."
      />
      <p className="muted">
        Diferencia: <strong>efecto del problema</strong> = consecuencia de que el problema exista hoy; <strong>efecto del proyecto</strong> = cambio que produce
        la intervención. Arrastra una tarjeta a una columna o usa sus selectores.
      </p>
      <div className="v22-columns">
        {kinds.map((k) => (
          <div
            key={k}
            className={"v22-column " + (over === k ? "drop-over" : "")}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(k);
            }}
            onDragLeave={() => setOver("")}
            onDrop={(e) => {
              e.preventDefault();
              setOver("");
              place(e.dataTransfer.getData("text/plain"), { kind: k });
            }}
          >
            <strong>{kindText[k]}</strong>
            {placements
              .filter((p) => p.kind === k)
              .map((p) => {
                const f = feedbackOf(p.id);
                return (
                  <small key={p.id} tabIndex={f ? 0 : undefined} {...fb(f?.level, f?.text ?? "")}>
                    {cards.find((c) => c.id === p.id)?.text}
                  </small>
                );
              })}
          </div>
        ))}
      </div>
      <div className="v22-cards">
        {cards.map((c) => {
          const p = placements.find((x) => x.id === c.id),
            isImpact = p?.kind === "impactoPositivo" || p?.kind === "impactoNegativo",
            f = feedbackOf(c.id);
          return (
            <article
              key={c.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
              className={p ? "placed" : ""}
              {...fb(f?.level, f?.text ?? "")}
            >
              <strong>{c.text}</strong>
              <div className="two-col">
                <label>
                  Clasificación
                  <select value={p?.kind ?? ""} onChange={(e) => place(c.id, { kind: e.target.value as ImpactKind })}>
                    <option value="">Sin clasificar</option>
                    {kinds.map((k) => (
                      <option key={k} value={k}>
                        {kindText[k]}
                      </option>
                    ))}
                  </select>
                </label>
                {isImpact && (
                  <label>
                    ¿Quién lo recibe?
                    <select value={p?.group ?? ""} onChange={(e) => place(c.id, { group: e.target.value as Beneficiary })}>
                      <option value="">Elegir grupo</option>
                      {groups.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <Button disabled={placements.length < cards.length} onClick={() => send({ type: "impacts", placements })}>
        Confirmar clasificación ({placements.length}/{cards.length})
      </Button>
      {saved.length > 0 &&
        (help.immediate ? (
          <div className="chain-feedback" role="status">
            <p>
              <strong>Clasificación: {review.score}/100.</strong>
            </p>
            {marks && (
              <FeedbackLegend
                counts={{
                  ok: count("ok"),
                  alerta: count("alerta"),
                  grave: count("grave"),
                }}
              />
            )}
            {help.detail !== "score" && (
              <details className="fb-details">
                <summary>Ver la retroalimentación en lista</summary>
                <ul className="findings">
                  {review.rows
                    .filter((r) => r.status !== "correcta")
                    .map((r) => (
                      <Status key={r.card.id} level={r.status === "grupo incorrecto" ? "alerta" : "grave"}>
                        «{r.card.text}»: {r.status}
                        {help.detail === "full" && (
                          <>
                            {" "}
                            — corresponde a {kindText[r.card.kind].toLowerCase()}. {r.card.why}
                          </>
                        )}
                      </Status>
                    ))}
                  {review.rows.every((r) => r.status === "correcta") && <Status level="ok">Todas las tarjetas están bien clasificadas.</Status>}
                </ul>
              </details>
            )}
          </div>
        ) : (
          <Deferred />
        ))}
    </Panel>
  );
}
