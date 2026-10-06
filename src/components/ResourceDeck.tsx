import { useEffect, useRef, useState, useId } from "react";
import {
  Wallet,
  Clock,
  Search,
  Landmark,
  Users,
  Star,
  ShieldAlert,
  Leaf,
  X,
  ArrowUpRight,
} from "lucide-react";
import type { GameState } from "../domain/types";
import {
  resourceViews,
  resourceChanges,
  type ResourceId,
  type ResourceView,
} from "../domain/resources";
import { money } from "../domain/finance";
import { missions } from "../data/world";
const icons = {
  cash: Wallet,
  time: Clock,
  information: Search,
  capacity: Landmark,
  support: Users,
  reputation: Star,
  risk: ShieldAlert,
  sustainability: Leaf,
};

function ResourceScene({ resource }: { resource: ResourceView }) {
  const unique = useId().replace(/:/g, ""),
    level = resource.level / 100;
  return (
    <div className="resource-scene">
      <svg
        viewBox="0 0 520 210"
        role="img"
        aria-label={`Ilustración del centro de recursos. ${resource.label}: ${resource.display}`}
      >
        <defs>
          <linearGradient id={unique} x2="0" y2="1">
            <stop stopColor="#163f4a" />
            <stop offset="1" stopColor="#09242e" />
          </linearGradient>
        </defs>
        <rect width="520" height="210" rx="14" fill={`url(#${unique})`} />
        <path
          d="M0 135L80 52 128 104 223 38 302 118 388 57 520 143V210H0"
          fill="#345457"
          opacity=".55"
        />
        <path d="M38 174L250 115 483 166 276 207Z" fill="#386362" />
        <path d="M38 174L276 207V216L38 185Z" fill="#213f44" />
        <g className="resource-building">
          <path d="M151 107L258 77 349 110 244 141Z" fill="#a6b6a0" />
          <path d="M151 107L244 141V184L151 151Z" fill="#517d79" />
          <path d="M244 141L349 110V153L244 184Z" fill="#294f58" />
          {Array.from({ length: 6 }, (_, i) => (
            <rect
              key={i}
              x={256 + i * 13}
              y={142 - i * 3.9}
              width="7"
              height="12"
              fill={i < Math.round(level * 6) ? "#f3d78f" : "#183a43"}
              className="resource-window"
            />
          ))}
          <path d="M173 103L249 82 284 96 207 117Z" fill="#c4cbb1" />
          <path d="M191 107L250 91 267 97 208 114Z" fill="#32697a" />
        </g>
        <g>
          <path d="M80 117L110 108 130 116 101 125Z" fill="#c6b797" />
          <path d="M80 117V159L101 166V125Z" fill="#608589" />
          <path d="M101 125L130 116V157L101 166Z" fill="#315e6e" />
          <path
            d={`M104 ${160 - level * 31}L125 ${154 - level * 31}V153L104 160Z`}
            fill="#79d0ce"
            className="resource-liquid"
          />
        </g>
        <path
          d="M110 171L156 157M350 150L405 163"
          stroke="#d9be7a"
          strokeWidth="3"
          strokeDasharray="5 5"
          className="resource-flow"
        />
        <g transform="translate(407 130)">
          <path d="M0 22V-33" stroke="#d2b782" strokeWidth="4" />
          <path d="M-24 -33H24M0 -56V-10" stroke="#b4c9b6" strokeWidth="3" />
          <circle cy="-33" r="7" fill="#d8bc79" />
        </g>
        <circle cx="372" cy="178" r="5" fill="#e0b96d" />
        <circle cx="386" cy="173" r="5" fill="#86bba3" />
      </svg>
      <small>
        Centro del distrito · representación simbólica del indicador
      </small>
    </div>
  );
}

function ResourceDetails({
  g,
  resource,
  onClose,
  change,
}: {
  g: GameState;
  resource: ResourceView;
  onClose: () => void;
  change?: ReturnType<typeof resourceChanges>[number];
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    Icon = icons[resource.id];
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal resource-dialog"
      onCancel={onClose}
      aria-label={"Detalle de " + resource.label}
    >
      <button
        className="modal-close icon-btn"
        onClick={onClose}
        aria-label="Cerrar recursos"
      >
        <X />
      </button>
      <div className="resource-detail-title">
        <Icon />
        <div>
          <span>{missions[g.scenarioId].district}</span>
          <h2>{resource.label}</h2>
        </div>
        <strong>{resource.display}</strong>
      </div>
      <ResourceScene resource={resource} />
      <p>{resource.explanation}</p>
      <div className="resource-advice">
        <ArrowUpRight size={20} />
        <p>{resource.influence}</p>
      </div>
      {change && (
        <p className="resource-last-change">
          Último cambio: {change.delta > 0 ? "+" : "−"}
          {resource.id === "cash"
            ? money(Math.abs(change.delta))
            : Math.abs(change.delta).toFixed(1)}
          {resource.id === "time"
            ? " meses"
            : resource.id === "cash"
              ? ""
              : " puntos"}{" "}
          · {change.reason}
        </p>
      )}
      {resource.id === "cash" && (
        <>
          <h3>¿Dónde está el dinero?</h3>
          <dl className="ledger-breakdown">
            <div>
              <dt>Caja disponible total</dt>
              <dd>$ {money(g.cash)}</dd>
            </div>
            <div>
              <dt>Compromisos dentro de la caja</dt>
              <dd>$ {money(g.committed)}</dd>
            </div>
            <div>
              <dt>Saldo libre = caja − compromisos</dt>
              <dd>$ {money(g.cash - g.committed)}</dd>
            </div>
            <div>
              <dt>Gastos ya ejecutados</dt>
              <dd>$ {money(g.spent)}</dd>
            </div>
            <div>
              <dt>Contingencia presupuestada{g.snapshot ? " restante" : ""}</dt>
              <dd>$ {money(g.budget.contingency)}</dd>
            </div>
            <div>
              <dt>Capital de crédito contratado</dt>
              <dd>
                ${" "}
                {money(
                  g.loans
                    .filter((l) => l.type === "credito")
                    .reduce((n, l) => n + l.principal, 0),
                )}
              </dd>
            </div>
          </dl>
          <p className="muted">
            La contingencia no es dinero adicional. El crédito aumenta caja y
            genera servicio de deuda en los flujos; el capital mostrado no es un
            saldo de amortización actualizado.
          </p>
        </>
      )}
      <p className="resource-hint">
        Consultar este panel no consume recursos. Las decisiones se toman en las
        herramientas de cada etapa.
      </p>
      <button className="btn" onClick={onClose}>
        Volver a la misión
      </button>
    </dialog>
  );
}

export default function ResourceDeck({ g }: { g: GameState }) {
  const [opened, setOpened] = useState<ResourceId | null>(null),
    previous = useRef(g),
    [changes, setChanges] = useState<ReturnType<typeof resourceChanges>>([]),
    [pulse, setPulse] = useState(0),
    [flashing, setFlashing] = useState(false);
  useEffect(() => {
    const difference = resourceChanges(previous.current, g);
    previous.current = g;
    if (difference.length) {
      setChanges(difference);
      setPulse((p) => p + 1);
      setFlashing(true);
    }
  }, [g]);
  useEffect(() => {
    if (!changes.length) return;
    const timer = setTimeout(() => setFlashing(false), 5500);
    return () => clearTimeout(timer);
  }, [changes]);
  const resources = resourceViews(g);
  return (
    <>
      <nav
        className="resource-bar resource-deck"
        aria-label="Recursos de la misión"
      >
        {resources.map((r) => {
          const Icon = icons[r.id],
            change = flashing ? changes.find((c) => c.id === r.id) : undefined;
          return (
            <button
              key={r.id}
              className={
                "resource-tile " +
                (change
                  ? change.favorable === false
                    ? "resource-fall"
                    : change.favorable === true
                      ? "resource-rise"
                      : "resource-move"
                  : "")
              }
              onClick={() => setOpened(r.id)}
              aria-label={`${r.label}: ${r.display}. Ver detalles`}
              aria-haspopup="dialog"
            >
              <Icon size={17} />
              <span className="resource-tile-copy">
                <span>{r.label}</span>
                <strong key={change ? pulse : r.display}>{r.display}</strong>
                <span className="resource-meter" aria-hidden="true">
                  <i style={{ width: r.level + "%" }} />
                </span>
              </span>
              {change && (
                <span key={pulse} className="resource-delta">
                  {change.delta > 0 ? "+" : "−"}
                  {r.id === "cash"
                    ? money(Math.abs(change.delta))
                    : Math.abs(change.delta).toFixed(0)}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      {opened && (
        <ResourceDetails
          g={g}
          resource={resources.find((r) => r.id === opened)!}
          change={changes.find((c) => c.id === opened)}
          onClose={() => setOpened(null)}
        />
      )}
    </>
  );
}
