import type { GameState, Difficulty } from "./types";
import { chainV2Score } from "./projectV2";

export interface Challenge {
  version: 1;
  id: string;
  title: string;
  scenarioId: string;
  difficulty: Difficulty;
  seed: string;
  noCredit: boolean;
  minimumChain: number;
  minimumCoverage: number;
  minimumScore: number;
}
export const challenges: Challenge[] = [
  {
    version: 1,
    id: "agua-autonoma",
    title: "Agua sin hipotecar el futuro",
    scenarioId: "agua",
    difficulty: "profesional",
    seed: "LIONES-AGUA-01",
    noCredit: true,
    minimumChain: 80,
    minimumCoverage: 50,
    minimumScore: 60,
  },
  {
    version: 1,
    id: "salud-resiliente",
    title: "La última red de cuidado",
    scenarioId: "salud",
    difficulty: "experto",
    seed: "LIONES-SALUD-01",
    noCredit: false,
    minimumChain: 80,
    minimumCoverage: 50,
    minimumScore: 60,
  },
];

export function validChallenge(g: GameState): boolean {
  const c = g.v2?.challenge;
  if (c === undefined) return true;
  return (
    !!c &&
    c.version === 1 &&
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    c.scenarioId === g.scenarioId &&
    c.seed === g.seed &&
    c.difficulty === g.difficulty &&
    typeof c.noCredit === "boolean" &&
    [c.minimumChain, c.minimumCoverage, c.minimumScore].every(
      (n) => Number.isFinite(n) && n >= 0 && n <= 100,
    )
  );
}
export function challengeProgress(g: GameState) {
  const c = g.v2?.challenge;
  if (!c) return null;
  const formulation = g.snapshot?.decisionState ?? g;
  const chain = chainV2Score(formulation);
  const goals = [
    {
      label: "Completar el proyecto sin incumplimiento",
      value: g.outcome?.status ?? "En curso",
      met: g.outcome?.status === "completado",
    },
    {
      label: `Cadena de valor al invertir ≥ ${c.minimumChain}/100`,
      value: `${chain.toFixed(0)}/100${g.snapshot ? "" : " · provisional"}`,
      met: !!g.snapshot && chain >= c.minimumChain,
    },
    {
      label: `Cobertura observada ≥ ${c.minimumCoverage} %`,
      value: g.outcome
        ? `${(g.outcome.coverage * 100).toFixed(1)} %`
        : "Se verifica al cierre",
      met: !!g.outcome && g.outcome.coverage * 100 >= c.minimumCoverage,
    },
    {
      label: `Evaluación final ≥ ${c.minimumScore}/100`,
      value: g.outcome ? `${g.outcome.score}/100` : "Se verifica al cierre",
      met: !!g.outcome && g.outcome.score >= c.minimumScore,
    },
    ...(c.noCredit
      ? [
          {
            label: "Sin contratar crédito durante la partida",
            value: g.loans.some((l) => l.type === "credito")
              ? "Crédito contratado"
              : "Sin crédito",
            met: !g.loans.some((l) => l.type === "credito"),
          },
        ]
      : []),
  ];
  return {
    challenge: c,
    goals,
    won: !!g.outcome && goals.every((goal) => goal.met),
  };
}
