/**
 * NormalizedProject: the single contract shared by the three project sources
 * (official missions, imported PDF/Excel and projects created from scratch).
 *
 *   official ─┐
 *   pdf/xlsx ─┼─> NormalizedProject ─> validation ─> MissionGenerator ─> Scenario ─> act() (única máquina)
 *   manual   ─┘
 *
 * Values are plain data. A missing value is `null` or an empty string/list and is shown as «No identificada»:
 * nothing is invented. Where a value came from (page, sheet, cell) and how reliable it is lives in `evidence`,
 * keyed by field path (for example "alternatives.a1.investment").
 */
export const projectSchemaVersion = 1;

export type ProjectSourceType = "official" | "imported_pdf" | "imported_excel" | "manual";
export type Confidence = "alta" | "media" | "baja";
export type ProjectProfile = "estudiante" | "creador";
export type ProjectStatus = "borrador" | "listo";

export interface SourceReference {
  page?: number;
  sheet?: string;
  cell?: string;
  section?: string;
  /** Short literal excerpt of the source, for review. */
  excerpt?: string;
}
export interface Evidence {
  confidence: Confidence;
  ref?: SourceReference;
  /** True once a person reviewed or edited the value after import. */
  reviewed?: boolean;
}
export interface ProjectSource {
  type: ProjectSourceType;
  fileName?: string;
  officialId?: string;
  importedAt?: string;
  /** Project this one was duplicated from. */
  duplicatedFrom?: string;
}
export interface TreeItem {
  id: string;
  text: string;
  level: "directa" | "indirecta";
}
export interface ProjectActor {
  id: string;
  name: string;
  interest?: string;
  /** 0–100 */
  power?: number | null;
  /** −100 (opposes) … 100 (supports) */
  position?: number | null;
  influence?: string;
}
export interface ProjectPopulation {
  /** People or units affected by the problem (demand). */
  affected: number | null;
  /** People or units the project will serve. */
  target: number | null;
  /** Units currently served (current supply). */
  currentSupply: number | null;
  /** Total population of the territory. */
  total: number | null;
  unit: string;
  characteristics: string;
}
export interface SpecificObjective {
  id: string;
  text: string;
  /** Cause of the problem tree that this objective answers. */
  causeId?: string;
}
export type RiskLevel = "baja" | "media" | "alta";
export interface ProjectAlternative {
  id: string;
  name: string;
  description: string;
  /** Millions of COP */
  investment: number | null;
  /** Annual operation and maintenance, millions of COP */
  om: number | null;
  /** Annual financial revenue, millions of COP */
  revenue: number | null;
  /** Annual social (economic) benefit, millions of COP */
  socialBenefit: number | null;
  /** Construction months */
  months: number | null;
  /** Useful life, years */
  life: number | null;
  residual: number | null;
  capacity: string;
  /** Share of the target population covered, 0–1 */
  coverage: number | null;
  risk: RiskLevel | null;
  /** Environmental balance −50 … 50 (negative harms). */
  environment: number | null;
  tradeoff: string;
  /** Causes the alternative addresses. */
  causeIds: string[];
}
export interface ValueChain {
  inputs: string[];
  activities: string[];
  products: string[];
  outcomes: string[];
  impacts: string[];
}
export type CostCategory = "inversion" | "operacion" | "mantenimiento" | "otros";
export interface CostItem {
  id: string;
  label: string;
  category: CostCategory;
  amount: number | null;
  alternativeId?: string;
}
export type BenefitKind = "ingreso" | "ahorro" | "beneficioEconomico" | "impactoValorado";
export interface BenefitItem {
  id: string;
  label: string;
  kind: BenefitKind;
  amount: number | null;
}
export type ImpactTypeId =
  | "salud"
  | "tiempo"
  | "productividad"
  | "propiedad"
  | "recreacion"
  | "ahorro"
  | "ambiente"
  | "emisiones"
  | "variedad";
export interface ProjectImpact {
  id: string;
  text: string;
  kind: "efecto" | "impacto";
  direction: "positivo" | "negativo";
  group: string;
  magnitude: string;
  duration: string;
  /** Kind of welfare change; decides which valuation methods fit. */
  type?: ImpactTypeId;
  /** Valuation method id from the method library (optional). */
  method?: string;
  /** Annual value in millions of COP when it was valued. */
  annualValue?: number | null;
  /** Data available to value it (study, survey, prices). */
  data?: string;
  /** Measurement: unit and quantity per person served per year (e.g. 45 horas). */
  unit?: string;
  perPerson?: number | null;
  /** Another impact that measures the same welfare change (double counting). */
  overlapWith?: string;
}
export interface Assumption {
  id: string;
  label: string;
  value: string;
}
export interface ProjectRisk {
  id: string;
  name: string;
  probability: RiskLevel | null;
  impact: RiskLevel | null;
  mitigation: string;
}
export type FailureType =
  | "Externalidades"
  | "Monopolio natural"
  | "Poder de mercado"
  | "Información asimétrica"
  | "Bienes públicos"
  | "Ninguna falla suficiente";
export interface ProjectRegulation {
  failure: FailureType | null;
  externalities: string;
  existing: string;
  tariffs: string;
  subsidies: string;
  competition: string;
  restrictions: string;
  intervention: string;
}
export interface ProjectSdgs {
  /** SDGs the creator relates to the project. */
  suggested: number[];
  /** When true the player must identify them (the suggestion becomes the expected answer). */
  playerIdentifies: boolean;
}
export interface ActivityOverride {
  question?: string;
  options?: { id: string; text: string }[];
  answers?: string[];
  explanation?: string;
  points?: number;
  difficulty?: string;
  disabled?: boolean;
}
/** Creator / teacher settings (perfil creador). */
export interface CreatorSettings {
  difficulty?: "guiado" | "profesional" | "experto";
  hints?: boolean;
  /** Field paths hidden to the player until bought (information center). */
  hiddenData?: string[];
  /** Edits made to generated activities, keyed by activity id. */
  activities?: Record<string, ActivityOverride>;
  /** Extra distractors for the problem tree. */
  distractors?: string[];
}
export interface NormalizedProject {
  schemaVersion: typeof projectSchemaVersion;
  id: string;
  metadata: {
    createdAt: string;
    updatedAt: string;
    profile: ProjectProfile;
    status: ProjectStatus;
    /** Increases on every saved edit (used to know if a generated mission is outdated). */
    revision: number;
  };
  source: ProjectSource;
  title: string;
  description: string;
  sector: string;
  territory: string;
  projectType: "publico" | "privado";
  /** Evaluation horizon, years. */
  horizon: number | null;
  problem: string;
  causes: TreeItem[];
  problemEffects: TreeItem[];
  actors: ProjectActor[];
  population: ProjectPopulation;
  generalObjective: string;
  specificObjectives: SpecificObjective[];
  /** Ends (fines) that answer the effects of the problem. */
  ends: { effectId: string; text: string }[];
  alternatives: ProjectAlternative[];
  valueChain: ValueChain;
  costs: CostItem[];
  benefits: BenefitItem[];
  impacts: ProjectImpact[];
  financial: {
    /** Financial discount rate, decimal (0.12). */
    rate: number | null;
    /** Available budget, millions of COP. */
    budget: number | null;
    /** Deadline, months. */
    deadline: number | null;
  };
  economic: {
    /** Social discount rate, decimal. */
    socialRate: number | null;
    /** Accounting price ratios applied by category id (optional overrides). */
    rpc: Record<string, number>;
    adjustments: string;
  };
  assumptions: Assumption[];
  risks: ProjectRisk[];
  regulation: ProjectRegulation;
  sdgs: ProjectSdgs;
  creator?: CreatorSettings;
  evidence: Record<string, Evidence>;
}

/** Stored generated mission: a frozen snapshot, so later edits never change a game in progress. */
export interface GeneratedMissionRecord {
  missionId: string;
  projectId: string;
  projectRevision: number;
  createdAt: string;
  config: MissionConfig;
  project: NormalizedProject;
}
export type MissionDuration = "rapida" | "normal" | "completa";
export type MissionMode = "aprendizaje" | "evaluacion" | "exploracion";
export interface MissionConfig {
  difficulty: "guiado" | "profesional" | "experto";
  mode: MissionMode;
  duration: MissionDuration;
}

/** Future teacher mode (PREPARADO): shapes documented so a backend can adopt them without migrations. */
export interface TeacherProject {
  projectId: string;
  owner: string;
  missions: string[];
}
export interface Assignment {
  id: string;
  missionId: string;
  title: string;
  dueDate?: string;
  config: MissionConfig;
}
export interface StudentAttempt {
  assignmentId: string;
  student: string;
  gameId: string;
  startedAt: string;
  finishedAt?: string;
}
export interface AttemptResult {
  attempt: StudentAttempt;
  score: number;
  dimensions: { name: string; value: number }[];
}
