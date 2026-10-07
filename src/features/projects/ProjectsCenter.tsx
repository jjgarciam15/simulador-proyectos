import { useState } from "react";
import { Copy, Eye, FilePlus2, FileUp, Pencil, Play, RotateCcw, Trash2, Wand2 } from "lucide-react";
import { scenarios } from "../../data/scenarios";
import { officialProject } from "../../domain/project/project";
import { completeness, reviewProject } from "../../domain/project/validation";
import type { GeneratedMissionRecord, NormalizedProject } from "../../domain/project/types";
import type { GameState } from "../../domain/types";
import { Button, Panel } from "../../components/ui";
import { Preview } from "./ProjectBuilder";

const sourceLabel = { official: "Misión oficial", imported_pdf: "Importado (PDF)", imported_excel: "Importado (Excel)", manual: "Creado" };
const difficultyLabel = { guiado: "Guiado", profesional: "Profesional", experto: "Experto" };
type Tab = "oficiales" | "importados" | "creados" | "borradores" | "partidas";
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
};

/** «Mis proyectos»: official missions, imported and created projects, drafts and games in one place. */
export default function ProjectsCenter({
  projects,
  missions,
  games,
  onPlayOfficial,
  onCreate,
  onImport,
  onEdit,
  onDuplicate,
  onDelete,
  onPlayMission,
  onContinue,
  onForkGame,
  onReset,
}: {
  projects: NormalizedProject[];
  missions: GeneratedMissionRecord[];
  games: GameState[];
  onPlayOfficial: (id: string) => void;
  onCreate: () => void;
  onImport: () => void;
  onEdit: (p: NormalizedProject) => void;
  onDuplicate: (p: NormalizedProject) => void;
  onDelete: (p: NormalizedProject) => void;
  onPlayMission: (missionId: string) => void;
  onContinue: (g: GameState) => void;
  onForkGame: (g: GameState) => void;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<Tab>("creados"),
    [preview, setPreview] = useState<NormalizedProject | null>(null),
    [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const imported = projects.filter((p) => p.source.type === "imported_pdf" || p.source.type === "imported_excel"),
    created = projects.filter((p) => p.source.type === "manual"),
    drafts = projects.filter((p) => !reviewProject(p).ready),
    counts: Record<Tab, number> = { oficiales: scenarios.length, importados: imported.length, creados: created.length, borradores: drafts.length, partidas: games.length };
  const tabs: { id: Tab; label: string }[] = [
    { id: "oficiales", label: "Oficiales" },
    { id: "importados", label: "Importados" },
    { id: "creados", label: "Creados" },
    { id: "borradores", label: "Borradores" },
    { id: "partidas", label: "Partidas" },
  ];
  const card = (p: NormalizedProject) => {
    const comp = completeness(p).percent,
      ready = reviewProject(p).ready,
      own = missions.filter((m) => m.projectId === p.id),
      last = own.at(-1);
    return (
      <article key={p.id} className="pc-card">
        <header>
          <span className={"pc-source " + p.source.type}>{sourceLabel[p.source.type]}</span>
          <span className={"pc-state " + (ready ? "ready" : "draft")}>{ready ? "Listo para simular" : "Borrador"}</span>
        </header>
        <h3>{p.title || "Proyecto sin nombre"}</h3>
        <p className="muted">{p.problem || "Problema no identificado"}</p>
        <div className="pb-bar" aria-label={`Completitud ${comp} %`}>
          <i style={{ width: comp + "%" }} />
        </div>
        <dl>
          <dt>Completitud</dt>
          <dd>{comp} %</dd>
          <dt>Dificultad</dt>
          <dd>{last ? difficultyLabel[last.config.difficulty] : p.creator?.difficulty ? difficultyLabel[p.creator.difficulty] : "Por definir"}</dd>
          <dt>Última edición</dt>
          <dd>{fmtDate(p.metadata.updatedAt)}</dd>
          <dt>Partidas generadas</dt>
          <dd>{own.length}</dd>
        </dl>
        <div className="pc-actions">
          {last && (
            <Button onClick={() => onPlayMission(last.missionId)}>
              <Play size={14} /> Jugar
            </Button>
          )}
          <Button secondary onClick={() => onEdit(p)}>
            {ready && !last ? <Wand2 size={14} /> : <Pencil size={14} />} {ready && !last ? "Generar partida" : "Editar"}
          </Button>
          <button type="button" className="text-btn" onClick={() => setPreview(p)}>
            <Eye size={14} /> Vista previa
          </button>
          <button type="button" className="text-btn" onClick={() => onDuplicate(p)}>
            <Copy size={14} /> Duplicar
          </button>
          {confirmDelete === p.id ? (
            <span className="pc-confirm">
              ¿Eliminar el proyecto y sus {own.length} partida(s) generada(s)?{" "}
              <button type="button" className="text-btn danger" onClick={() => (onDelete(p), setConfirmDelete(null))}>
                Sí, eliminar
              </button>{" "}
              <button type="button" className="text-btn" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
            </span>
          ) : (
            <button type="button" className="text-btn danger" onClick={() => setConfirmDelete(p.id)}>
              <Trash2 size={14} /> Eliminar
            </button>
          )}
        </div>
      </article>
    );
  };
  const title = (g: GameState) => missions.find((m) => m.missionId === g.scenarioId)?.project.title ?? scenarios.find((s) => s.id === g.scenarioId)?.title ?? "Misión no disponible";
  return (
    <main className="projects-center">
      <div className="pc-head">
        <div>
          <span className="eyebrow">PLATAFORMA DE PROYECTOS</span>
          <h1>Mis proyectos</h1>
          <p className="lead">Aprende con un caso, analiza un proyecto real o construye el tuyo. Las tres fuentes usan el mismo simulador.</p>
        </div>
        <div className="actions">
          <Button onClick={onCreate}>
            <FilePlus2 size={16} /> Crear proyecto
          </Button>
          <Button secondary onClick={onImport}>
            <FileUp size={16} /> Importar proyecto
          </Button>
        </div>
      </div>
      <div className="pc-tabs" role="tablist" aria-label="Tipos de proyecto">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={"v22-tab " + (tab === t.id ? "on" : "")} onClick={() => setTab(t.id)}>
            {t.label} <span className="pc-count">{counts[t.id]}</span>
          </button>
        ))}
      </div>
      {tab === "oficiales" && (
        <div className="pc-grid">
          {scenarios.map((s) => {
            const p = officialProject(s.id);
            return (
              <article key={s.id} className="pc-card">
                <header>
                  <span className="pc-source official">Misión oficial</span>
                  <span className="pc-state ready">{s.role === "publico" ? (s.regulator ? "Regulador" : "Público") : "Privado"}</span>
                </header>
                <h3>{s.title}</h3>
                <p className="muted">{s.sector}</p>
                <div className="pc-actions">
                  <Button onClick={() => onPlayOfficial(s.id)}>
                    <Play size={14} /> Jugar
                  </Button>
                  <button type="button" className="text-btn" onClick={() => setPreview(p)}>
                    <Eye size={14} /> Vista previa
                  </button>
                  <button type="button" className="text-btn" onClick={() => onDuplicate(p)} title="Crea una copia editable para hacer variantes; la misión oficial no cambia.">
                    <Copy size={14} /> Duplicar como proyecto
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {tab === "importados" && <div className="pc-grid">{imported.length ? imported.map(card) : <Empty text="No has importado proyectos." action={<Button onClick={onImport}>Importar PDF o Excel</Button>} />}</div>}
      {tab === "creados" && <div className="pc-grid">{created.length ? created.map(card) : <Empty text="Todavía no has creado proyectos." action={<Button onClick={onCreate}>Crear proyecto desde cero</Button>} />}</div>}
      {tab === "borradores" && <div className="pc-grid">{drafts.length ? drafts.map(card) : <Empty text="No hay borradores pendientes." />}</div>}
      {tab === "partidas" && (
        <div className="history-list">
          {games.length ? (
            games.map((g) => (
              <div key={g.id} className="pc-game">
                <div>
                  <span className="eyebrow">
                    {g.scenarioId.startsWith("gen-") ? "Proyecto propio" : "Misión oficial"} · {g.seed} · mes {g.month}
                  </span>
                  <h3>{title(g)}</h3>
                  <p className="muted">{g.outcome ? `Terminada · ${g.outcome.score}/100` : "En curso"}</p>
                </div>
                <div className="pc-actions">
                  {!g.outcome && (
                    <Button onClick={() => onContinue(g)}>
                      <Play size={14} /> Continuar
                    </Button>
                  )}
                  <button type="button" className="text-btn" onClick={() => onForkGame(g)} title="Crea una copia de la partida para probar otra estrategia sin perder esta.">
                    <Copy size={14} /> Duplicar partida
                  </button>
                </div>
              </div>
            ))
          ) : (
            <Empty text="No hay partidas guardadas." />
          )}
        </div>
      )}
      <Panel title="Restablecer y compartir" kicker="DATOS DEL JUGADOR">
        <p className="muted">Borra partidas, puntuaciones, respuestas, bitácoras, proyectos importados y creados. Las misiones oficiales, el contenido y el Centro de aprendizaje se conservan.</p>
        <Button secondary onClick={onReset}>
          <RotateCcw size={15} /> Restablecer partidas…
        </Button>
      </Panel>
      {preview && (
        <div className="pc-preview" role="dialog" aria-label="Vista previa del proyecto">
          <div className="panel">
            <button type="button" className="text-btn" onClick={() => setPreview(null)}>
              Cerrar vista previa
            </button>
            <Preview p={preview} />
          </div>
        </div>
      )}
    </main>
  );
}
function Empty({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="pc-empty">
      <p>{text}</p>
      {action}
    </div>
  );
}
