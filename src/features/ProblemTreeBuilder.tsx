import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, GripVertical, X } from "lucide-react";
import type { GameState } from "../domain/types";
import type { Action } from "../domain/engine";
import { CENTRAL, childrenOf, descendantsOf, normalizeTree, placedLevel, treeCards, treeReview, treeSlots, type TreePlacement, type TreePlacements } from "../domain/problemTree";
import { helpPolicy } from "../domain/help";
import { useDraftGuard, different } from "../components/workbench";
import { Button, Panel, Tip } from "../components/ui";
import { ConceptLinks, Deferred, Status } from "./v22/common";

const levelName = Object.fromEntries(treeSlots.map((s) => [s.id, s.label])) as Record<string, string>;
/** Drop targets: the bank, «No pertenece», the central problem, a new branch of causes or effects, or a placed card. */
type Target = "bank" | "fuera" | "central" | "add:cause" | "add:effect" | `card:${string}`;

/**
 * Árbol del problema que construye el jugador, solo arrastrando: el problema central en el medio, las causas
 * cuelgan hacia abajo (cada causa indirecta de la causa que explica, con la profundidad que haga falta) y los
 * efectos crecen hacia arriba. Funciona con mouse, pantalla táctil (desde el asa ⋮⋮) y teclado
 * (Enter levanta una tarjeta y Enter sobre un destino la suelta).
 */
export default function ProblemTreeBuilder({ g, send }: { g: GameState; send: (a: Action) => void }) {
  const cards = treeCards(g),
    saved = normalizeTree(g, g.v2?.tree?.placements),
    help = helpPolicy(g),
    label = (id: string) => cards.find((c) => c.id === id)?.label ?? id;
  const [draft, setDraft] = useState<TreePlacements>(saved),
    [picked, setPicked] = useState<string | null>(null),
    [hover, setHover] = useState<string | null>(null),
    [message, setMessage] = useState(""),
    drag = useRef<{ id: string; x: number; y: number; active: boolean; ghost?: HTMLElement } | null>(null),
    // Ignores the click the browser fires right after a drag ends.
    justDragged = useRef(false),
    // Auto-scroll while dragging near the top or bottom edge (tall trees, fixed headers).
    edge = useRef<{ speed: number; timer?: number }>({ speed: 0 });
  useDraftGuard(different(draft, saved));

  /** Applies a drop. Cards that hang from a card sent back to the bank or to the other side return to the bank. */
  function drop(id: string, target: Target) {
    const next: TreePlacements = { ...draft },
      before = draft[id],
      subtree = descendantsOf(draft, id);
    let placement: TreePlacement | null = null;
    if (target === "fuera") placement = { side: "fuera" };
    else if (target === "central") placement = { side: "central" };
    else if (target === "add:cause") placement = { side: "cause", parent: CENTRAL };
    else if (target === "add:effect") placement = { side: "effect", parent: CENTRAL };
    else if (target.startsWith("card:")) {
      const parent = target.slice(5),
        p = draft[parent];
      if (parent === id || subtree.includes(parent)) return setMessage("Una tarjeta no puede colgar de sí misma ni de las que dependen de ella.");
      if (!p || (p.side !== "cause" && p.side !== "effect")) return setMessage("Suelta la tarjeta sobre una causa o un efecto del árbol.");
      placement = { side: p.side, parent };
    }
    const keepsSubtree = placement && before && (placement.side === "cause" || placement.side === "effect") && placement.side === before.side;
    if (!keepsSubtree) for (const d of subtree) delete next[d];
    if (target === "central") for (const [k, p] of Object.entries(next)) if (p.side === "central" && k !== id) delete next[k];
    if (placement) next[id] = placement;
    else delete next[id];
    setDraft(next);
    setPicked(null);
    const where =
      target === "bank" ? "devuelta al banco" : target === "fuera" ? "fuera del árbol" : target === "central" ? "como problema central" : target === "add:cause" ? "como causa directa" : target === "add:effect" ? "como efecto directo" : `colgando de «${label(target.slice(5))}»`;
    setMessage(`«${label(id)}» ${where}.${!keepsSubtree && subtree.length ? ` ${subtree.length} tarjeta(s) que colgaban de ella volvieron al banco.` : ""}`);
  }

  /* ---------- Pointer drag (mouse, pen and touch from the grip) ---------- */
  const zoom = () => parseFloat(getComputedStyle(document.documentElement).zoom || "1") || 1;
  const targetAt = (x: number, y: number) => (document.elementFromPoint(x, y)?.closest("[data-drop]") as HTMLElement | null)?.dataset.drop as Target | undefined;
  function onPointerDown(e: ReactPointerEvent<HTMLElement>, id: string) {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    if (e.pointerType === "touch" && !(e.target as HTMLElement).closest(".ptb-grip")) return;
    // No text selection and no native drag of selected text: either would cancel this drag.
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    drag.current = { id, x: e.clientX, y: e.clientY, active: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d) return;
    if (!d.active) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
      d.active = true;
      const ghost = document.createElement("div");
      ghost.className = "ptb-ghost";
      ghost.textContent = label(d.id);
      document.body.appendChild(ghost);
      d.ghost = ghost;
      setPicked(d.id);
    }
    const z = zoom();
    d.ghost!.style.transform = `translate(${e.clientX / z + 12}px, ${e.clientY / z + 12}px)`;
    setHover(targetAt(e.clientX, e.clientY) ?? null);
    const top = 170 * z,
      bottom = window.innerHeight - 90;
    // Only when the card is carried towards the edge (not when a drag simply starts near it).
    const towardsTop = e.clientY < top && e.clientY < d.y - 30,
      towardsBottom = e.clientY > bottom && e.clientY > d.y + 30;
    edge.current.speed = towardsTop ? -Math.min(24, (top - e.clientY) / 4 + 6) : towardsBottom ? Math.min(24, (e.clientY - bottom) / 4 + 6) : 0;
    if (edge.current.speed && !edge.current.timer) edge.current.timer = window.setInterval(() => (edge.current.speed ? window.scrollBy(0, edge.current.speed) : stopEdge()), 16);
  }
  function stopEdge() {
    window.clearInterval(edge.current.timer);
    edge.current = { speed: 0 };
  }
  function onPointerUp(e: ReactPointerEvent<HTMLElement>) {
    const d = drag.current;
    drag.current = null;
    stopEdge();
    if (!d?.active) return;
    // The click that follows the drop may land on another element: ignore it until the next press.
    justDragged.current = true;
    d.ghost?.remove();
    setHover(null);
    const target = targetAt(e.clientX, e.clientY);
    if (target) drop(d.id, target);
    else {
      setPicked(null);
      setMessage("Suelta la tarjeta sobre el árbol, el banco o «No pertenece al árbol».");
    }
  }
  function onPointerCancel() {
    stopEdge();
    drag.current?.ghost?.remove();
    drag.current = null;
    setHover(null);
    setPicked(null);
  }
  useEffect(
    () => () => {
      drag.current?.ghost?.remove();
      window.clearInterval(edge.current.timer);
    },
    [],
  );

  /* ---------- Click, tap and keyboard: pick a card, then choose where it goes ---------- */
  function pick(id: string) {
    if (picked === id) {
      setPicked(null);
      setMessage("Tarjeta soltada sin moverla.");
    } else if (picked && draft[id] && (draft[id].side === "cause" || draft[id].side === "effect")) drop(picked, `card:${id}`);
    else {
      setPicked(id);
      setMessage(`Levantaste «${label(id)}». Elige dónde colgarla: el problema central, una nueva rama, otra tarjeta, el banco o «No pertenece al árbol». Esc cancela.`);
    }
  }
  const keys = (e: KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    } else if (e.key === "Escape" && picked) {
      setPicked(null);
      setMessage("Movimiento cancelado.");
    }
  };
  /** Props of a drop area; while a card is picked it can be chosen by click, tap or Enter. */
  const zone = (target: Target, name: string) => ({
    "data-drop": target,
    "aria-label": name,
    className: (hover === target ? " ptb-over" : "") + (picked ? " ptb-armed" : ""),
    ...(picked
      ? {
          role: "button",
          tabIndex: 0,
          onClick: () => (justDragged.current ? void (justDragged.current = false) : drop(picked, target)),
          onKeyDown: (e: KeyboardEvent) => keys(e, () => drop(picked, target)),
        }
      : {}),
  });

  const card = (id: string): ReactNode => {
    const lv = placedLevel(draft, id),
      inTree = !!draft[id];
    return (
      <div
        key={id}
        className={"ptb-card" + (inTree ? " placed" : "") + (picked === id ? " picked" : "") + (hover === `card:${id}` ? " ptb-over" : "")}
        data-drop={draft[id]?.side === "cause" || draft[id]?.side === "effect" ? `card:${id}` : undefined}
        role="button"
        tabIndex={0}
        aria-pressed={picked === id}
        aria-label={`${label(id)}${lv && lv !== "fuera" ? `, ${levelName[lv].toLowerCase()}` : ""}. ${picked && picked !== id && inTree ? "Enter: colgar aquí la tarjeta levantada." : "Enter: levantar para moverla."}`}
        onPointerDown={(e) => onPointerDown(e, id)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onDragStart={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          if (justDragged.current) return void (justDragged.current = false);
          if (!(e.target as HTMLElement).closest("button")) pick(id);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          keys(e, () => pick(id));
        }}
      >
        <GripVertical size={15} aria-hidden className="ptb-grip" />
        <span className="ptb-text">{label(id)}</span>
        {lv && lv !== "fuera" && lv !== "central" && <small className="ptb-level">{levelName[lv]}</small>}
        {inTree && (
          <button type="button" className="icon-btn" aria-label={`Devolver «${label(id)}» al banco`} onClick={(e) => (e.stopPropagation(), drop(id, "bank"))}>
            <X size={14} />
          </button>
        )}
      </div>
    );
  };
  /** A card with the branch that hangs from it: causes grow downwards, effects upwards. */
  const branch = (id: string, side: "cause" | "effect"): ReactNode => {
    const kids = childrenOf(draft, id, side);
    return (
      <li key={id} className="ptb-node">
        {card(id)}
        {kids.length > 0 && <ul className="ptb-kids">{kids.map((k) => branch(k, side))}</ul>}
      </li>
    );
  };
  const bank = cards.filter((c) => !draft[c.id]),
    out = cards.filter((c) => draft[c.id]?.side === "fuera"),
    central = cards.find((c) => draft[c.id]?.side === "central"),
    causes = childrenOf(draft, CENTRAL, "cause"),
    effects = childrenOf(draft, CENTRAL, "effect"),
    complete = bank.length === 0 && !!central;
  const review = g.v2?.tree ? treeReview(g) : null;
  return (
    <Panel title="Construye el Árbol del problema" kicker="02 / CONECTA LAS CAUSAS">
      {/* A new press always starts a fresh interaction (clears the «ignore the click after a drop» flag). */}
      <div className={"ptb-root" + (picked ? " ptb-dragging" : "")} onPointerDownCapture={() => (justDragged.current = false)}>
      <ConceptLinks ids={["arbol", "causa-efecto"]} />
      <p className="muted">
        Arrastra las {cards.length} tarjetas para armar el árbol: el problema central en el medio, cada <strong>causa directa</strong> colgando del problema y cada{" "}
        <strong>causa indirecta</strong> colgando de la causa que explica (suéltala encima de esa causa). Los efectos crecen hacia arriba de la misma forma. Las trampas
        (soluciones disfrazadas, objetivos, causas demasiado generales o situaciones que no explican el problema) van a «No pertenece al árbol».
      </p>
      <p className="ptb-help muted">
        Mouse: arrastra la tarjeta. Pantalla táctil: arrastra desde el asa ⋮⋮. Teclado o toque: Enter o toque para levantarla y
        Enter o toque sobre el destino para soltarla.
      </p>
      <div className="ptb-layout">
        <div {...zone("bank", "Banco de tarjetas")} className={"ptb-bank" + (bank.length ? "" : " empty") + zone("bank", "").className}>
          <strong>Banco de tarjetas · {bank.length} por ubicar</strong>
          <div className="ptb-stack">{bank.map((c) => card(c.id))}</div>
          {!bank.length && <p className="muted">Todas las tarjetas están ubicadas.</p>}
        </div>
        <div className="ptb-tree">
          <section className="ptb-side ptb-effects" aria-label="Efectos">
            <div {...zone("add:effect", "Agregar un efecto directo")} className={"ptb-add" + zone("add:effect", "").className}>
              <ArrowUp size={15} aria-hidden />
              <span>
                Suelta aquí un <strong>efecto directo</strong> · suéltalo sobre un efecto para colgar su efecto indirecto
              </span>
            </div>
            {effects.length > 0 && <ul className="ptb-roots ptb-up">{effects.map((id) => branch(id, "effect"))}</ul>}
          </section>
          <div {...zone("central", "Problema central")} className={"ptb-central" + zone("central", "").className}>
            <span className="tree-label">Problema central</span>
            {central ? card(central.id) : <span className="ptb-empty">Arrastra aquí el problema central</span>}
          </div>
          <section className="ptb-side ptb-causes" aria-label="Causas">
            <div {...zone("add:cause", "Agregar una causa directa")} className={"ptb-add" + zone("add:cause", "").className}>
              <ArrowDown size={15} aria-hidden />
              <span>
                Suelta aquí una <strong>causa directa</strong> · suéltala sobre una causa para colgar su causa indirecta
              </span>
            </div>
            {causes.length > 0 && <ul className="ptb-roots">{causes.map((id) => branch(id, "cause"))}</ul>}
          </section>
        </div>
      </div>
      <div {...zone("fuera", "No pertenece al árbol")} className={"ptb-out" + zone("fuera", "").className}>
        <span className="tree-label">No pertenece al árbol</span>
        <div className="ptb-stack">{out.length ? out.map((c) => card(c.id)) : <span className="ptb-empty">Arrastra aquí las trampas</span>}</div>
      </div>
      <p className="ptb-live" role="status" aria-live="polite">
        {message}
      </p>
      <Button secondary disabled={!complete} onClick={() => send({ type: "tree", placements: draft })}>
        Confirmar Árbol del problema
      </Button>
      {!complete && <small className="muted"> Ubica las {cards.length} tarjetas y elige el problema central para confirmar.</small>}
      </div>
      {review &&
        (help.immediate ? (
          <ul className="findings">
            <Status level={review.score >= 90 ? "ok" : review.score >= 60 ? "alerta" : "grave"}>Construcción del árbol: {review.score}/100.</Status>
            {help.detail !== "score" &&
              review.rows
                .filter((r) => r.credit < 1)
                .map((r) => (
                  <Status key={r.card.id} level={r.credit ? "alerta" : "grave"}>
                    «{r.card.label}»: {r.status}.
                    {help.detail === "full" && (
                      <>
                        {" "}
                        Va en {levelName[r.card.slot].toLowerCase()}
                        {r.card.parents && r.card.parents[0] !== CENTRAL ? `, colgando de «${label(r.card.parents[0])}»` : ""}: {r.card.why}
                      </>
                    )}
                  </Status>
                ))}
          </ul>
        ) : (
          <Deferred />
        ))}
      <Tip title="Problema, causa y solución">
        Describe una situación negativa verificable. La ausencia de una obra concreta no demuestra cuál es el problema. Las causas directas explican el problema; las indirectas explican la causa de la que cuelgan.
        Los efectos directos son consecuencias inmediatas y los indirectos, consecuencias de un efecto directo.
      </Tip>
    </Panel>
  );
}
