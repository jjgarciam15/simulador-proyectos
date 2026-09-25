/**
 * Dilemas y eventos condicionales previos a la inversión.
 * Declarative content: conditions, probability modifiers and effects are data, so balance can change
 * without touching the engine. Money is a fraction of the mission budget (negative = cost).
 * Text placeholders: {mission} {alternative} {actor0} {actor1} {actor2} {failure} {policy}.
 */
export interface DilemmaCondition {
  missingStudy?: string;
  hasStudy?: string;
  supportBelow?: number;
  supportAtLeast?: number;
  role?: "publico" | "privado";
  policy?: string;
  /** Selected alternative has a negative environmental score. */
  environmentalPressure?: boolean;
  /** Contingency below this share of the technical budget. */
  contingencyBelow?: number;
}
export interface DilemmaEffects {
  cash?: number;
  months?: number;
  support?: number;
  reputation?: number;
  quality?: number;
  sustainability?: number;
  capacity?: number;
  performance?: number;
  eventRisk?: number;
}
export interface DilemmaChoice {
  id: string;
  label: string;
  effects: DilemmaEffects;
  delayed?: { effects: DilemmaEffects; note: string };
  lesson: string;
}
export interface DilemmaTemplate {
  id: string;
  /** Fires when this stage is completed for the first time. */
  stage: number;
  concept: string;
  title: string;
  context: string;
  conditions: DilemmaCondition;
  probability: { base: number; modifiers: { when: DilemmaCondition; factor: number }[] };
  choices: DilemmaChoice[];
  explanation: string;
}
export const dilemmaTemplates: DilemmaTemplate[] = [
  {
    id: "diag-assembly",
    stage: 0,
    concept: "Actores y aceptación social",
    title: "{actor0} pide una asamblea",
    context:
      "Antes de formular, {actor0} exige ser escuchado. Organizar la asamblea toma un mes; omitirla acelera el trabajo pero deja preguntas abiertas.",
    conditions: { missingStudy: "social" },
    probability: { base: 0.75, modifiers: [{ when: { supportBelow: 45 }, factor: 1.3 }] },
    choices: [
      {
        id: "asamblea",
        label: "Organizar la asamblea",
        effects: { cash: -0.004, months: 1, support: 8, reputation: 3 },
        lesson: "Escuchar cuesta tiempo, pero reduce la oposición futura.",
      },
      {
        id: "informar",
        label: "Enviar un boletín informativo",
        effects: { cash: -0.001, support: 2 },
        delayed: { effects: { support: -3 }, note: "La comunidad sintió que se le informó sin escucharla." },
        lesson: "Informar no es consultar: la aceptación ganada es frágil.",
      },
      {
        id: "omitir",
        label: "Continuar sin reunión",
        effects: {},
        delayed: {
          effects: { support: -8, eventRisk: 0.1 },
          note: "La oposición creció y aumentó la exposición a conflictos durante la ejecución.",
        },
        lesson: "Ahorrar hoy en participación puede traducirse en retrasos y conflictos mañana.",
      },
    ],
    explanation:
      "Un actor con interés alto y posición negativa puede bloquear la ejecución. La estrategia de relacionamiento es una inversión con retorno incierto.",
  },
  {
    id: "diag-cooperation",
    stage: 0,
    concept: "Valor de la información",
    title: "Una agencia ofrece compartir datos",
    context:
      "Una agencia de cooperación tiene encuestas recientes de {mission}. Pide a cambio que el proyecto publique sus indicadores. Revisar los datos toma un mes.",
    conditions: { role: "publico" },
    probability: { base: 0.35, modifiers: [{ when: { missingStudy: "demanda" }, factor: 1.4 }] },
    choices: [
      {
        id: "aceptar",
        label: "Aceptar y publicar indicadores",
        effects: { months: 1, quality: 10, reputation: 2, capacity: -3 },
        lesson: "Información gratuita no es información sin costo: exige tiempo y capacidad de reporte.",
      },
      {
        id: "rechazar",
        label: "Rechazar y avanzar",
        effects: {},
        lesson: "Conservas tiempo, pero decides con la información que ya tienes.",
      },
    ],
    explanation: "El valor de la información depende de si puede cambiar una decisión y de lo que cuesta obtenerla.",
  },
  {
    id: "form-priority",
    stage: 1,
    concept: "Costo de oportunidad",
    title: "Solo puedes reforzar un frente",
    context:
      "El equipo técnico de {alternative} tiene capacidad para mejorar una sola dimensión antes de presupuestar. Cualquier elección sacrifica las demás.",
    conditions: {},
    probability: { base: 1, modifiers: [] },
    choices: [
      {
        id: "cobertura",
        label: "Ampliar cobertura",
        effects: { cash: -0.006, reputation: 1 },
        delayed: { effects: { performance: 0.03, sustainability: -2 }, note: "La ampliación llegó a más hogares, con mayor presión operativa." },
        lesson: "Más cobertura, más exigencia de operación y mantenimiento.",
      },
      {
        id: "calidad",
        label: "Mejorar calidad técnica",
        effects: { cash: -0.006, capacity: 6 },
        delayed: { effects: { performance: 0.02, sustainability: 3 }, note: "El diseño reforzado mejoró la confiabilidad del servicio." },
        lesson: "La calidad sostiene el servicio, aunque no amplía el alcance.",
      },
      {
        id: "riesgo",
        label: "Reducir riesgo",
        effects: { cash: -0.006, quality: 4 },
        delayed: { effects: { eventRisk: -0.1 }, note: "Los planes de contingencia redujeron la exposición a eventos." },
        lesson: "Reducir riesgo no se ve hasta que ocurre el evento.",
      },
      {
        id: "liquidez",
        label: "Conservar la liquidez",
        effects: {},
        lesson: "No gastar mantiene caja para imprevistos, pero no mejora el proyecto.",
      },
    ],
    explanation: "Con recursos escasos no es posible maximizar cobertura, calidad, rapidez, bajo costo y bajo riesgo al mismo tiempo.",
  },
  {
    id: "form-cheap-design",
    stage: 1,
    concept: "Información imperfecta",
    title: "Un diseño rápido y barato",
    context:
      "Un contratista ofrece diseñar {alternative} en la mitad del tiempo, sin estudios de campo. Ahorra formulación, pero la inversión técnica aún no está verificada.",
    conditions: { missingStudy: "tecnico" },
    probability: { base: 0.8, modifiers: [] },
    choices: [
      {
        id: "aceptar",
        label: "Aceptar el diseño rápido",
        effects: {},
        delayed: {
          effects: { performance: -0.05, eventRisk: 0.12 },
          note: "El diseño sin estudios subestimó condiciones del terreno.",
        },
        lesson: "Reducir el diagnóstico baja el costo inicial y aumenta la incertidumbre de costos.",
      },
      {
        id: "revision",
        label: "Exigir revisión independiente",
        effects: { cash: -0.008, months: 1, quality: 8 },
        delayed: { effects: { performance: 0.01 }, note: "La revisión corrigió errores de diseño a tiempo." },
        lesson: "Pagar por verificar es comprar información antes de comprometer.",
      },
      {
        id: "clausula",
        label: "Aceptar con cláusula de ajuste",
        effects: { cash: -0.003, reputation: -1 },
        delayed: { effects: { eventRisk: 0.05 }, note: "La cláusula trasladó parte del riesgo, no todo." },
        lesson: "Un contrato puede repartir el riesgo, pero no lo elimina.",
      },
    ],
    explanation: "Omitir estudios reduce costos hoy y traslada incertidumbre a la ejecución: ahí los errores son más caros.",
  },
  {
    id: "prep-inflation",
    stage: 2,
    concept: "Contingencia y riesgo",
    title: "Alza en precios de materiales",
    context:
      "Los proveedores anuncian un alza del 6 % para los materiales de {alternative}. Puedes asegurar precios ahora, pagar la diferencia o reducir especificaciones.",
    conditions: {},
    probability: { base: 0.45, modifiers: [{ when: { contingencyBelow: 0.05 }, factor: 1.4 }] },
    choices: [
      {
        id: "fijar",
        label: "Firmar contrato a precio fijo",
        effects: { cash: -0.004, months: 1 },
        lesson: "Asegurar precios cuesta tiempo y una prima, pero reduce la incertidumbre.",
      },
      {
        id: "pagar",
        label: "Pagar el sobrecosto con caja libre",
        effects: { cash: -0.01 },
        lesson: "Sin contingencia, el imprevisto consume caja que podía financiar impacto.",
      },
      {
        id: "recortar",
        label: "Reducir especificaciones",
        effects: {},
        delayed: { effects: { performance: -0.04, sustainability: -2 }, note: "Las especificaciones reducidas acortaron la vida útil." },
        lesson: "Recortar calidad ahorra hoy y reduce el desempeño futuro.",
      },
    ],
    explanation: "La contingencia existe para absorber este tipo de choques sin sacrificar alcance ni calidad.",
  },
  {
    id: "prep-cofinance",
    stage: 2,
    concept: "Financiación",
    title: "Un fondo regional ofrece cofinanciación",
    context:
      "Un fondo ofrece aportar recursos si el proyecto reporta indicadores de resultado cada trimestre. El reporte consume capacidad del equipo.",
    conditions: { role: "publico", supportAtLeast: 50 },
    probability: { base: 0.4, modifiers: [{ when: { supportAtLeast: 65 }, factor: 1.5 }] },
    choices: [
      {
        id: "aceptar",
        label: "Aceptar con reporte trimestral",
        effects: { cash: 0.015, months: 1, capacity: -4, reputation: 2 },
        lesson: "Financiación con condiciones: más caja, menos capacidad libre.",
      },
      {
        id: "rechazar",
        label: "Rechazar y mantener autonomía",
        effects: {},
        lesson: "La autonomía tiene un costo de oportunidad: los recursos que no llegan.",
      },
    ],
    explanation: "La cofinanciación no es beneficio social: es una fuente de caja con obligaciones.",
  },
  {
    id: "prep-supplier",
    stage: 2,
    concept: "Financiación",
    title: "Un proveedor ofrece crédito comercial",
    context:
      "Un proveedor de {alternative} ofrece anticipar equipos con pago diferido si se compromete la exclusividad de repuestos.",
    conditions: { role: "privado" },
    probability: { base: 0.5, modifiers: [] },
    choices: [
      {
        id: "aceptar",
        label: "Aceptar exclusividad",
        effects: { cash: 0.012 },
        delayed: { effects: { performance: -0.02 }, note: "La exclusividad encareció repuestos y mantenimiento." },
        lesson: "Liquidez hoy a cambio de dependencia mañana.",
      },
      {
        id: "rechazar",
        label: "Mantener proveedores abiertos",
        effects: {},
        lesson: "La competencia entre proveedores protege costos futuros.",
      },
    ],
    explanation: "Un financiamiento comercial puede esconder costos en el ciclo de vida.",
  },
  {
    id: "eval-optimism",
    stage: 3,
    concept: "Evaluación ex ante",
    title: "Presentar el escenario optimista",
    context:
      "El Consejo sugiere usar la demanda del escenario optimista como base para asegurar la aprobación de {alternative}.",
    conditions: { missingStudy: "demanda" },
    probability: { base: 0.65, modifiers: [] },
    choices: [
      {
        id: "optimista",
        label: "Presentar el escenario optimista",
        effects: { reputation: 2 },
        delayed: { effects: { reputation: -8, support: -4 }, note: "La demanda prometida no se materializó y se perdió credibilidad." },
        lesson: "Inflar supuestos consigue aprobación y compromete la credibilidad.",
      },
      {
        id: "base",
        label: "Presentar el escenario base",
        effects: { support: -2 },
        lesson: "Ser prudente puede restar apoyo inmediato, pero protege la credibilidad.",
      },
      {
        id: "tres",
        label: "Mostrar los tres escenarios",
        effects: { months: 1, quality: 5, reputation: 1 },
        lesson: "Comunicar la incertidumbre mejora la discusión de la decisión.",
      },
    ],
    explanation: "La evaluación ex ante sirve para decidir con honestidad antes de comprometer recursos, no para justificar una decisión tomada.",
  },
  {
    id: "reg-capture",
    stage: 4,
    concept: "Captura regulatoria",
    title: "El operador ofrece redactar el estándar",
    context:
      "El operador principal ofrece redactar gratis el estándar técnico de {policy}. Conoce el sector, pero también tiene interés en limitar competidores.",
    conditions: { policy: "strict" },
    probability: { base: 0.85, modifiers: [] },
    choices: [
      {
        id: "aceptar",
        label: "Aceptar la propuesta del operador",
        effects: { months: 0 },
        delayed: { effects: { performance: -0.04, reputation: -5 }, note: "El estándar favoreció al incumbente y frenó la entrada de nuevos oferentes." },
        lesson: "La información del regulado es útil, pero su interés puede capturar la regla.",
      },
      {
        id: "consulta",
        label: "Abrir consulta pública",
        effects: { cash: -0.005, months: 1, reputation: 3 },
        lesson: "La transparencia reduce el riesgo de captura a cambio de tiempo.",
      },
      {
        id: "comite",
        label: "Crear un comité técnico independiente",
        effects: { cash: -0.01, capacity: 5 },
        lesson: "Capacidad regulatoria propia cuesta, pero reduce la asimetría de información.",
      },
    ],
    explanation: "Captura regulatoria: la regla termina sirviendo al regulado y no a los usuarios.",
  },
  {
    id: "reg-subsidy",
    stage: 4,
    concept: "Subsidios y focalización",
    title: "Piden un subsidio general",
    context:
      "{actor1} pide un subsidio para todos los usuarios de {mission}. Es popular, pero beneficia también a quienes no lo necesitan.",
    conditions: { policy: "none" },
    probability: { base: 0.55, modifiers: [] },
    choices: [
      {
        id: "general",
        label: "Otorgar subsidio general",
        effects: { cash: -0.012, support: 6 },
        delayed: { effects: { performance: -0.02 }, note: "El subsidio no focalizado redujo recursos para operación." },
        lesson: "Un subsidio general es popular y poco eficiente.",
      },
      {
        id: "focalizado",
        label: "Subsidio focalizado",
        effects: { cash: -0.005, support: 3, months: 1 },
        lesson: "Focalizar cuesta tiempo de diseño y rinde más por peso gastado.",
      },
      {
        id: "mantener",
        label: "Mantener la decisión de no intervenir",
        effects: { support: -4 },
        lesson: "Sostener una decisión técnica puede costar apoyo político.",
      },
    ],
    explanation: "Un subsidio corrige un problema de acceso si llega a quien lo necesita; si no, es una transferencia costosa.",
  },
  {
    id: "reg-environment",
    stage: 4,
    concept: "Externalidades",
    title: "Advertencia ambiental",
    context:
      "Una organización ambiental advierte impactos de {alternative} que no están en el presupuesto. Pide un plan de manejo antes de invertir.",
    conditions: { missingStudy: "ambiental", environmentalPressure: true },
    probability: { base: 0.7, modifiers: [] },
    choices: [
      {
        id: "plan",
        label: "Financiar un plan de manejo",
        effects: { cash: -0.008, sustainability: 6 },
        delayed: { effects: { eventRisk: -0.05 }, note: "El plan de manejo anticipó exigencias ambientales." },
        lesson: "Internalizar una externalidad cuesta y reduce riesgos futuros.",
      },
      {
        id: "ignorar",
        label: "Continuar sin cambios",
        effects: {},
        delayed: { effects: { eventRisk: 0.1, sustainability: -4 }, note: "La externalidad no gestionada aumentó la exposición a sanciones." },
        lesson: "Ignorar una externalidad traslada su costo a terceros y al futuro.",
      },
    ],
    explanation: "Una externalidad es un costo que no paga quien lo genera. Reconocerla cambia la evaluación social.",
  },
];
