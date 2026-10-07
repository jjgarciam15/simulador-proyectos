import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

/**
 * Retroalimentación sobre el propio elemento: after a module is confirmed, each card, option or row is
 * painted green (correct), amber (partly right) or red (wrong) with a corner icon, and hovering, focusing
 * or tapping it shows why. One tooltip serves the whole game (see `FeedbackTooltip`).
 */
export type FeedbackLevel = "ok" | "alerta" | "grave";
export const feedbackName: Record<FeedbackLevel, string> = { ok: "Correcto", alerta: "Revisar", grave: "Error" };
export interface FeedbackProps {
  "data-fb"?: FeedbackLevel;
  "data-feedback"?: string;
}
/** Attributes that mark an element with its feedback; nothing when there is no feedback to show. */
export function fb(level: FeedbackLevel | null | undefined, text: string): FeedbackProps {
  return level ? { "data-fb": level, "data-feedback": text } : {};
}
/** Legend shown above marked elements so the colors are never the only cue. */
export function FeedbackLegend({ counts }: { counts?: Partial<Record<FeedbackLevel, number>> }) {
  const n = (k: FeedbackLevel) => (counts && counts[k] !== undefined ? ` (${counts[k]})` : "");
  return (
    <p className="fb-legend">
      <span className="fb-key ok">
        <CheckCircle2 size={14} aria-hidden /> Correcto{n("ok")}
      </span>
      <span className="fb-key alerta">
        <AlertTriangle size={14} aria-hidden /> Revisar{n("alerta")}
      </span>
      <span className="fb-key grave">
        <XCircle size={14} aria-hidden /> Error{n("grave")}
      </span>
      <span className="muted">Pasa el mouse, enfoca o toca cada elemento marcado para ver por qué.</span>
    </p>
  );
}

const TIP_ID = "fb-tooltip";
const zoom = () => parseFloat(getComputedStyle(document.documentElement).zoom || "1") || 1;

/** The single floating tooltip: follows hover (mouse), focus (keyboard) and taps (touch). */
export function FeedbackTooltip() {
  const [tip, setTip] = useState<{ level: FeedbackLevel; text: string; x: number; y: number; below: boolean; width: number } | null>(null);
  const current = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const hide = () => {
      current.current?.removeAttribute("aria-describedby");
      current.current = null;
      setTip(null);
    };
    const show = (el: HTMLElement) => {
      current.current?.removeAttribute("aria-describedby");
      current.current = el;
      el.setAttribute("aria-describedby", TIP_ID);
      const z = zoom(),
        r = el.getBoundingClientRect(),
        vw = window.innerWidth / z,
        width = Math.min(360, vw - 24),
        center = (r.left + r.width / 2) / z,
        below = r.top < 150 * z;
      setTip({
        level: el.dataset.fb as FeedbackLevel,
        text: el.dataset.feedback ?? "",
        x: Math.min(Math.max(center, width / 2 + 12), vw - width / 2 - 12),
        y: (below ? r.bottom + 8 : r.top - 8) / z,
        below,
        width,
      });
    };
    // Keyboard focus wins over the pointer until the pointer really moves (scrolling to the focused element
    // makes the browser fire «pointerover» for whatever ends up under a still mouse).
    let byFocus = false;
    const over = (e: Event) => {
      if (e.type === "focusin") byFocus = true;
      else if (byFocus) return;
      // Never while a card is being dragged.
      if (document.querySelector(".ptb-ghost")) return hide();
      const el = (e.target as Element | null)?.closest?.("[data-feedback]") as HTMLElement | null;
      if (el === current.current) return;
      if (el) show(el);
      else hide();
    };
    const out = (e: FocusEvent) => {
      if (current.current && !current.current.contains(e.relatedTarget as Node | null)) hide();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && hide();
    // Scrolling keeps the tooltip on its element (it follows it), and hides it once the element is gone or covered
    // (a chapter intro, a dialog, another stage).
    let frame = 0;
    const covered = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return true;
      // Covered only when none of a few points of the element is visible (a sticky bar may hide part of it).
      const points = [
        [r.left + r.width / 2, r.top + r.height / 2],
        [r.left + 8, r.top + 8],
        [r.left + 8, r.bottom - 8],
        [r.right - 8, r.bottom - 8],
      ];
      return !points.some(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        return !!hit && (el.contains(hit) || !!hit.closest("#" + TIP_ID));
      });
    };
    const check = window.setInterval(() => {
      const el = current.current;
      if (el && (!el.isConnected || !el.dataset.feedback || covered(el))) hide();
    }, 400);
    const follow = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = current.current;
        if (!el) return;
        if (!el.isConnected || !el.dataset.feedback) return hide();
        show(el);
      });
    };
    const moved = (e: Event) => {
      if (!byFocus) return;
      byFocus = false;
      over(e);
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointermove", moved, { passive: true });
    document.addEventListener("focusin", over);
    document.addEventListener("focusout", out);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointermove", moved);
      document.removeEventListener("focusin", over);
      document.removeEventListener("focusout", out);
      document.removeEventListener("keydown", key);
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
      cancelAnimationFrame(frame);
      window.clearInterval(check);
    };
  }, []);
  if (!tip) return null;
  const Icon = tip.level === "ok" ? CheckCircle2 : tip.level === "grave" ? XCircle : AlertTriangle;
  return (
    <div
      id={TIP_ID}
      role="tooltip"
      className={"fb-tooltip " + tip.level + (tip.below ? " below" : "")}
      style={{ left: tip.x, top: tip.y, width: tip.width }}
    >
      <Icon size={16} aria-hidden />
      <span>
        <strong>{feedbackName[tip.level]}:</strong> {tip.text}
      </span>
    </div>
  );
}
