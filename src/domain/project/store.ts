import { clearGeneratedScenarios, registerGeneratedScenario, unregisterGeneratedScenario, isGeneratedScenario } from "../../data/scenarios";
import { missionImpacts } from "../../data/impacts";
import { missionProfiles } from "../../data/missionProfiles";
import { directSDGs } from "../../data/relationships";
import { missions } from "../../data/world";
import { createGameV2 } from "../engine";
import type { GameState } from "../types";
import { generateMission, type GeneratedMission } from "./generator";
import { clearActivities, dropActivities, setActivities } from "./activityRegistry";
export { generatedActivitiesFor } from "./activityRegistry";
import { uid } from "./project";
import { parseProject } from "./schema";
import type { GeneratedMissionRecord, MissionConfig, NormalizedProject } from "./types";

/**
 * Local store of player projects and generated missions (browser localStorage, no external service).
 * Generated missions are frozen snapshots (project + config) and are rebuilt with the MissionGenerator
 * at start-up, so the engine always sees them exactly as when they were generated.
 */
export interface ProjectStore {
  schemaVersion: 1;
  projects: NormalizedProject[];
  missions: GeneratedMissionRecord[];
}
const qa = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("qa") === "1";
export const storageKeys = {
  game: qa ? "proyecta-qa-v1" : "proyecta-v1",
  projects: qa ? "proyecta-qa-projects-v1" : "proyecta-projects-v1",
  exam: "proyecta-exam2-v1",
};
export const emptyStore = (): ProjectStore => ({ schemaVersion: 1, projects: [], missions: [] });

export function decodeStore(raw: string | null): ProjectStore {
  if (!raw) return emptyStore();
  const data = JSON.parse(raw);
  if (!data || data.schemaVersion !== 1 || !Array.isArray(data.projects) || !Array.isArray(data.missions)) throw new Error("Almacén de proyectos incompatible.");
  const projects: NormalizedProject[] = [];
  for (const p of data.projects) {
    try {
      projects.push(parseProject(p));
    } catch {
      /* an unreadable project is skipped; the rest stays available */
    }
  }
  const missionsOut: GeneratedMissionRecord[] = [];
  for (const m of data.missions) {
    try {
      if (typeof m?.missionId !== "string" || !m.missionId.startsWith("gen-")) continue;
      missionsOut.push({
        missionId: m.missionId,
        projectId: String(m.projectId ?? ""),
        projectRevision: Number(m.projectRevision) || 0,
        createdAt: String(m.createdAt ?? ""),
        config: {
          difficulty: ["guiado", "profesional", "experto"].includes(m.config?.difficulty) ? m.config.difficulty : "guiado",
          mode: ["aprendizaje", "evaluacion", "exploracion"].includes(m.config?.mode) ? m.config.mode : "aprendizaje",
          duration: ["rapida", "normal", "completa"].includes(m.config?.duration) ? m.config.duration : "normal",
        },
        project: parseProject(m.project),
      });
    } catch {
      /* skip */
    }
  }
  return { schemaVersion: 1, projects, missions: missionsOut };
}
export function loadStore(): ProjectStore {
  try {
    return decodeStore(localStorage.getItem(storageKeys.projects));
  } catch {
    return emptyStore();
  }
}
export function saveStore(store: ProjectStore) {
  localStorage.setItem(storageKeys.projects, JSON.stringify(store));
}

/* ---------------- Registry of generated missions (single engine) ---------------- */
const records = new Map<string, GeneratedMission>();
export const generatedMission = (id: string) => records.get(id);
const projectsByMission = new Map<string, NormalizedProject>();
export function registerMission(m: GeneratedMission, project: NormalizedProject) {
  registerGeneratedScenario(m.scenario);
  projectsByMission.set(m.id, project);
  missionImpacts[m.id] = m.impacts;
  missionProfiles[m.id] = m.profile;
  directSDGs[m.id] = m.directSdgs;
  missions[m.id] = m.meta;
  setActivities(m.id, m.activities);
  records.set(m.id, m);
}
export function unregisterMission(id: string) {
  if (!id.startsWith("gen-")) return;
  unregisterGeneratedScenario(id);
  delete missionImpacts[id];
  delete missionProfiles[id];
  delete directSDGs[id];
  delete missions[id];
  dropActivities(id);
  records.delete(id);
  projectsByMission.delete(id);
}
/** Rebuilds every stored generated mission. Returns the ids that could not be rebuilt. */
export function activateStore(store: ProjectStore) {
  for (const id of [...records.keys()]) unregisterMission(id);
  clearGeneratedScenarios();
  const failed: string[] = [];
  for (const r of store.missions) {
    const res = generateMission(r.project, r.config, r.missionId);
    if (res.ok) registerMission(res.mission, r.project);
    else failed.push(r.missionId);
  }
  return failed;
}

/** Generates and stores a mission from a project (snapshot). */
export function createMission(store: ProjectStore, project: NormalizedProject, config: MissionConfig, now = new Date().toISOString()) {
  const missionId = uid("gen");
  const res = generateMission(project, config, missionId);
  if (!res.ok) return { ok: false as const, errors: res.errors };
  registerMission(res.mission, structuredClone(project));
  const record: GeneratedMissionRecord = { missionId, projectId: project.id, projectRevision: project.metadata.revision, createdAt: now, config, project: structuredClone(project) };
  return { ok: true as const, mission: res.mission, store: { ...store, missions: [...store.missions, record] } };
}
/** Starts a game of a generated mission with the project's rates and horizon. Uses the same createGameV2 as official missions. */
export function startGeneratedGame(missionId: string, seed: string): GameState {
  const m = records.get(missionId);
  if (!m || !isGeneratedScenario(missionId)) throw new Error("La misión generada no está disponible. Vuelve a generarla desde Mis proyectos.");
  const c = m.config,
    p = m.scenario;
  const g = createGameV2(missionId, c.difficulty, seed, c.mode === "evaluacion" ? "evaluacion" : "aprendizaje");
  if (c.mode === "exploracion" && g.v2?.v22) g.v2.v22.exploration = true;
  const project = projectsByMission.get(missionId);
  if (project?.financial.rate) g.assumptions.discount = project.financial.rate;
  if (project?.economic.socialRate) g.assumptions.socialDiscount = project.economic.socialRate;
  g.assumptions.life = project?.horizon ?? Math.max(...p.alternatives.map((a) => a.life));
  return g;
}
/** Project snapshot behind a generated mission (for the information center). */
export const missionProject = (missionId: string) => projectsByMission.get(missionId);

/** Upsert of a project (draft autosave or explicit save). */
export function upsertProject(store: ProjectStore, p: NormalizedProject): ProjectStore {
  const exists = store.projects.some((x) => x.id === p.id);
  return { ...store, projects: exists ? store.projects.map((x) => (x.id === p.id ? p : x)) : [...store.projects, p] };
}
/** Deletes a project and its generated missions; returns mission ids whose games must be removed. */
export function deleteProject(store: ProjectStore, projectId: string) {
  const removed = store.missions.filter((m) => m.projectId === projectId).map((m) => m.missionId);
  removed.forEach(unregisterMission);
  return { store: { ...store, projects: store.projects.filter((p) => p.id !== projectId), missions: store.missions.filter((m) => m.projectId !== projectId) }, removedMissions: removed };
}

/* ---------------- Reset (player data only) ---------------- */
/** Keys of player data. Official missions, content, assets, preferences and the code are never stored here. */
export function playerDataKeys(storage: Pick<Storage, "length" | "key">) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (!k) continue;
    if (/^proyecta-(qa-)?v1(:unreadable)?$/.test(k) || /^proyecta-(qa-)?projects-v1$/.test(k) || k === storageKeys.exam || k.startsWith("proyecta-draft")) keys.push(k);
  }
  return keys;
}
/** RESTABLECER PARTIDAS: deletes games, scores, answers, progress, logs, imported and manual projects and drafts. */
export function resetPlayerData(storage: Storage) {
  const keys = playerDataKeys(storage);
  keys.forEach((k) => storage.removeItem(k));
  for (const id of [...records.keys()]) unregisterMission(id);
  clearGeneratedScenarios();
  clearActivities();
  projectsByMission.clear();
  return keys;
}
/** State-zero check used after reloading (PREPARAR SIMULADOR PARA COMPARTIR). */
export function verifyZeroState(storage: Storage) {
  return { leftovers: playerDataKeys(storage), generated: records.size };
}
