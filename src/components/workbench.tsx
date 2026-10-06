import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Circle, Navigation, Save } from "lucide-react";
import type { GameState } from "../domain/types";
import { available, projectCost } from "../domain/engine";

const DraftContext = createContext<(id: string, dirty: boolean) => void>(
  () => {},
);
export function DraftProvider({
  children,
  onChange,
}: {
  children: ReactNode;
  onChange: (n: number) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});
  const report = useCallback(
    (id: string, dirty: boolean) =>
      setDrafts((prev) =>
        prev[id] === dirty ? prev : { ...prev, [id]: dirty },
      ),
    [],
  );
  const count = Object.values(drafts).filter(Boolean).length;
  useEffect(() => onChange(count), [count, onChange]);
  return (
    <DraftContext.Provider value={report}>{children}</DraftContext.Provider>
  );
}
export function useDraftGuard(dirty: boolean) {
  const id = useId(),
    report = useContext(DraftContext);
  useEffect(() => {
    report(id, dirty);
    return () => report(id, false);
  }, [dirty, id, report]);
}
export const different = (a: unknown, b: unknown) =>
  JSON.stringify(a) !== JSON.stringify(b);

export function StageGuide({ g, pending }: { g: GameState; pending: number }) {
  const tasks = useMemo(() => {
    switch (g.phase) {
      case 0:
        return [
          { label: "Construir el árbol del problema", done: g.nodes.length >= 5 },
          { label: "Definir población objetivo", done: g.target > 0 },
          ...(g.contentVersion>=3?[{label:"Conectar relaciones en laboratorio MGA",done:(g.mga?.links.length??0)>=4}]:[]),
          {
            label: "Consultar actores o asumir su riesgo",
            done: Object.keys(g.actorActions).length > 0 || Object.keys(g.v2?.negotiations??{}).length>0,
            optional: true,
          },
        ];
      case 1:
        return [
          { label: "Definir el objetivo central", done: !!g.objective },
          { label: "Seleccionar una propuesta", done: !!g.alternative },
          {
            label: "Comparar alternativas",
            done: g.compared.length >= 2,
            optional: true,
          },
        ];
      case 2:
        return [
          {
            label: "Equilibrar presupuesto",
            done: projectCost(g) <= available(g),
          },
          { label: "Confirmar cronograma", done: g.activities.length >= 2 },
          { label: "Confirmar indicadores", done: g.indicators.length > 0 },
          ...(g.contentVersion>=3?[{label:"Confirmar cadena de valor MGA",done:g.v2?g.v2.chain.length>=5&&g.v2.connections.length>=4:!!g.mga?.chain.product&&(g.mga?.chain.activities.length??0)>=2}]:[]),
        ];
      case 3:
        return [
          {
            label: "Revisar y confirmar la evaluación",
            done: g.acknowledged.includes("evaluation"),
          },
        ];
      case 4:
        return [
          { label: "Confirmar diagnóstico e instrumento", done: !!g.failure },
          {
            label: "Explicar alineación estratégica",
            done: g.sdgs.length > 0,
            optional: true,
          },
        ];
      case 5:
        return [
          {
            label: "Contar con financiación suficiente",
            done: projectCost(g) <= available(g),
          },
          {
            label: "Registrar tu justificación",
            done: !!g.justification,
            optional: true,
          },
        ];
      default:
        return [];
    }
  }, [g]);
  if (!tasks.length) return null;
  return (
    <div className="stage-guide">
      <div className="guide-title">
        <Navigation size={17} />
        <strong>Tu siguiente decisión</strong>
        <span>
          {tasks.filter((t) => t.done).length}/{tasks.length}
        </span>
      </div>
      <div className="stage-checks">
        {tasks.map((t) => (
          <span key={t.label} className={t.done ? "complete" : ""}>
            {t.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}{" "}
            {t.label}
            {t.optional && <small>opcional</small>}
          </span>
        ))}
      </div>
      {pending > 0 && (
        <div className="draft-banner" role="status">
          <Save size={15} />
          {pending === 1
            ? "Hay una configuración"
            : "Hay " + pending + " configuraciones"}{" "}
          pendiente{pending === 1 ? "" : "s"} de confirmar. Los cambios
          exploratorios todavía no se han guardado.
        </div>
      )}
    </div>
  );
}
export function SectionNavigator({
  children,
  phase,
}: {
  children: ReactNode;
  phase: number;
}) {
  const ref = useRef<HTMLDivElement>(null),
    eventRef = useRef<HTMLElement | null>(null),
    [sections, setSections] = useState<{ id: string; title: string }[]>([]),
    [active, setActive] = useState(0),
    // Ex post can be read section by section or as one long report.
    [showAll, setShowAll] = useState(false);
  useEffect(() => {
    const elements = Array.from(
      ref.current?.querySelectorAll<HTMLElement>(":scope > section.panel") ??
        [],
    );
    const event =
      elements.find((el) => el.classList.contains("event-panel")) ?? null;
    const nextActive =
      event && event !== eventRef.current
        ? elements.indexOf(event)
        : Math.max(0, Math.min(active, elements.length - 1));
    eventRef.current = event;
    if (nextActive !== active) setActive(nextActive);
    const list = elements.map((el, i) => {
      const id = "phase-" + phase + "-section-" + i;
      el.id = id;
      el.hidden = !showAll && i !== nextActive;
      return {
        id,
        title: el.querySelector("h3")?.textContent ?? "Detalle " + (i + 1),
      };
    });
    setSections((prev) =>
      JSON.stringify(prev) === JSON.stringify(list) ? prev : list,
    );
  }, [children, phase, active, showAll]);
  useEffect(() => setShowAll(false), [phase]);
  /** Changes section instantly; only scrolls when the top of the sections is out of view. */
  function move(index: number) {
    setActive(index);
    setShowAll(false);
    const el = ref.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "auto", block: "start" });
  }
  return (
    <>
      {sections.length > 1 && (
        <nav className="section-nav" aria-label="Herramientas de esta etapa">
          {sections.map((s, i) => (
            <button
              aria-current={i === active ? "step" : undefined}
              aria-controls={s.id}
              className={i === active ? "active" : ""}
              key={s.id}
              onClick={() => move(i)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {s.title}
            </button>
          ))}
          <button className={"section-all" + (showAll ? " active" : "")} aria-pressed={showAll} onClick={() => setShowAll(!showAll)}>
            {showAll ? "Ver por secciones" : "Ver todo en una página"}
          </button>
        </nav>
      )}
      <div ref={ref} className="phase-sections">
        {children}
      </div>
      {sections.length > 1 && !showAll && (
        <div className="tool-navigation">
          <button disabled={active === 0} onClick={() => move(active - 1)}>
            ← Herramienta anterior
          </button>
          <span>
            {active + 1} / {sections.length}
          </span>
          <button
            disabled={active >= sections.length - 1}
            onClick={() => move(active + 1)}
          >
            Siguiente herramienta →
          </button>
        </div>
      )}
    </>
  );
}
