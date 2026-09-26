import { useState, type DragEvent } from "react";
import { ArrowDown, GripVertical, X } from "lucide-react";
import type { GameState } from "../domain/types";
import type { Action } from "../domain/engine";
import { treeCards, treeReview, treeSlots, type TreePlacements, type TreeSlot } from "../domain/problemTree";
import { helpPolicy } from "../domain/help";
import { useDraftGuard, different } from "../components/workbench";
import { Button, Panel, Tip } from "../components/ui";
import { Deferred, Status } from "./v22/common";

const levels = treeSlots.filter((s) => s.id !== "fuera");
const levelTitle: Record<string, string> = {
  impact: "Efectos indirectos",
  effect: "Efectos directos",
  central: "Problema central",
  direct: "Causas directas",
  indirect: "Causas indirectas",
  fuera: "No pertenece al árbol",
};
/**
 * Árbol del problema que construye el jugador: banco mezclado de tarjetas correctas y trampas.
 * Cada tarjeta se arrastra a un nivel (o se ubica con la lista, accesible con teclado) o se deja fuera.
 */
export default function ProblemTreeBuilder({ g, send }: { g: GameState; send: (a: Action) => void }) {
  const cards = treeCards(g),
    saved = g.v2?.tree?.placements ?? {},
    help = helpPolicy(g);
  const [draft, setDraft] = useState<TreePlacements>(saved);
  const [dragged, setDragged] = useState<string | null>(null);
  useDraftGuard(different(draft, saved));
  const place = (id: string, slot: TreeSlot | "") =>
    setDraft((d) => {
      const next = { ...d };
      if (!slot) delete next[id];
      else next[id] = slot;
      return next;
    });
  const drop = (slot: TreeSlot) => (e: DragEvent) => {
    e.preventDefault();
    const id = dragged ?? e.dataTransfer.getData("text/plain");
    if (id) place(id, slot);
    setDragged(null);
  };
  const bank = cards.filter((c) => !draft[c.id]),
    centralCount = Object.values(draft).filter((s) => s === "central").length,
    complete = bank.length === 0 && centralCount === 1;
  const review = g.v2?.tree ? treeReview(g) : null;
  const card = (id: string, inTree: boolean) => {
    const c = cards.find((x) => x.id === id)!;
    return (
      <li key={id} className={"ptb-card" + (inTree ? " placed" : "")} draggable onDragStart={(e) => (e.dataTransfer.setData("text/plain", id), setDragged(id))}>
        <GripVertical size={14} aria-hidden className="ptb-grip" />
        <span className="ptb-text">{c.label}</span>
        <select aria-label={`Ubicar «${c.label}»`} value={draft[id] ?? ""} onChange={(e) => place(id, e.target.value as TreeSlot | "")}>
          <option value="">Ubicar en…</option>
          {treeSlots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        {inTree && (
          <button type="button" className="icon-btn" aria-label={`Devolver «${c.label}» al banco`} onClick={() => place(id, "")}>
            <X size={14} />
          </button>
        )}
      </li>
    );
  };
  const zone = (slot: TreeSlot) => {
    const here = cards.filter((c) => draft[c.id] === slot);
    return (
      <div className={"ptb-zone ptb-" + slot} onDragOver={(e) => e.preventDefault()} onDrop={drop(slot)} aria-label={levelTitle[slot]}>
        <div className="tree-label">{levelTitle[slot]}</div>
        <ul>{here.length ? here.map((c) => card(c.id, true)) : <li className="ptb-empty">Arrastra aquí una tarjeta</li>}</ul>
      </div>
    );
  };
  return (
    <Panel title="Construye el Árbol del problema" kicker="02 / CONECTA LAS CAUSAS">
      <p className="muted">
        Tienes {cards.length} tarjetas mezcladas: algunas son causas o efectos reales del problema y otras son trampas (soluciones disfrazadas, objetivos, causas demasiado generales o situaciones que no explican el problema).
        Arrastra cada una a su nivel o usa la lista «Ubicar en…». Las trampas van a «No pertenece al árbol».
      </p>
      <div className="ptb-layout">
        <div className="ptb-bank" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = dragged ?? e.dataTransfer.getData("text/plain"); if (id) place(id, ""); setDragged(null); }}>
          <strong>Banco de tarjetas · {bank.length} por ubicar</strong>
          <ul>{bank.map((c) => card(c.id, false))}</ul>
          {!bank.length && <p className="muted">Todas las tarjetas están ubicadas.</p>}
        </div>
        <div className="ptb-tree">
          {levels.map((l, i) => (
            <div key={l.id}>
              {zone(l.id)}
              {i < levels.length - 1 && <ArrowDown className="tree-arrow" size={18} aria-hidden />}
            </div>
          ))}
          {zone("fuera")}
        </div>
      </div>
      {centralCount > 1 && <p className="pb-issues error">Solo puede haber un problema central.</p>}
      <Button secondary disabled={!complete} onClick={() => send({ type: "tree", placements: draft })}>
        Confirmar Árbol del problema
      </Button>
      {!complete && <small className="muted"> Ubica las {cards.length} tarjetas y elige un único problema central para confirmar.</small>}
      {review &&
        (help.immediate ? (
          <ul className="findings">
            <Status level={review.score >= 90 ? "ok" : review.score >= 60 ? "alerta" : "grave"}>Construcción del árbol: {review.score}/100.</Status>
            {help.detail !== "score" &&
              review.rows
                .filter((r) => r.credit < 1)
                .map((r) => (
                  <Status key={r.card.id} level={r.credit ? "alerta" : "grave"}>
                    «{r.card.label}»: {r.status}.{help.detail === "full" && <> Va en {levelTitle[r.card.slot].toLowerCase()}: {r.card.why}</>}
                  </Status>
                ))}
          </ul>
        ) : (
          <Deferred />
        ))}
      <Tip title="Problema, causa y solución">
        Describe una situación negativa verificable. La ausencia de una obra concreta no demuestra cuál es el problema. Las causas directas explican el problema; las indirectas explican las directas. Los efectos directos son
        consecuencias inmediatas y los indirectos, de más largo plazo.
      </Tip>
    </Panel>
  );
}
