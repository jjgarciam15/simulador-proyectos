import type { GameState } from "./types";
import type { QuestionV2 } from "./questionsV2";
import { scenarioById } from "../data/scenarios";
import { random } from "./finance";
import { difficultyRules } from "../data/balance";
type Option = [string, string, string];
/** One extra trap per case: it sounds rigorous but repeats a frequent conceptual error. Each case has 5 options in total. */
const traps: Record<string, Option> = {
  gap: [
    "ratio",
    "La brecha relevante es la razón oferta/demanda; con ella se define la meta en personas.",
    "Una razón describe la magnitud relativa, pero no convierte unidades de servicio en personas ni identifica a quién falta atender.",
  ],
  npv: [
    "average",
    "Unos 41 M, porque el promedio de los flujos descontados supera la inversión anual.",
    "El valor coincide por casualidad, pero el método es incorrecto: el VPN suma flujos descontados y resta la inversión, no promedia.",
  ],
  transfers: [
    "cost",
    "Registrar el subsidio como ahorro de costos del proyecto y reducir su inversión social.",
    "Quien financia no cambia el costo de los recursos usados: la obra sigue consumiendo lo mismo para la sociedad.",
  ],
  regulation: [
    "entry",
    "Aprobarla si reduce accidentes, aunque desaparezcan todos los entrantes pequeños.",
    "El beneficio de seguridad es real, pero ignorar la pérdida de competencia omite un costo social de la regla.",
  ],
  causality: [
    "compare",
    "Atribuir al proyecto la diferencia entre la meta y la línea base, porque así se planificó.",
    "La meta es un objetivo, no un contrafactual: no indica qué habría ocurrido sin el proyecto.",
  ],
};
export function appliedCases(g: GameState): QuestionV2[] {
  const s = scenarioById(g.scenarioId);
  function make(
    id: string,
    phase: number,
    concept: string,
    question: string,
    options: Option[],
    explanation: string,
    hints: string[],
  ): QuestionV2 {
    return {
      id: "applied-" + id,
      phase,
      concept,
      context: s.title,
      difficulty: g.difficulty,
      question,
      options: [...options, ...(traps[id] ? [traps[id]] : [])]
        .map(([id, text, feedback]) => ({ id, text, feedback }))
        .sort((a, b) => random(g.seed, id + a.id) - random(g.seed, id + b.id)),
      answers: ["reason"],
      explanation,
      hints,
      points: 100,
      penalty: difficultyRules[g.difficulty].hintPenalty,
      tags: [concept, "aplicación"],
    };
  }
  const deficit = s.demand - s.supply;
  return [
    make(
      "gap",
      0,
      "Oferta, demanda y población",
      `En ${s.title}, la demanda de referencia es ${s.demand.toLocaleString("es-CO")} ${s.unit} y la oferta es ${s.supply.toLocaleString("es-CO")} ${s.unit}. ¿Qué conclusión puedes sostener?`,
      [
        [
          "reason",
          `El déficit es ${deficit.toLocaleString("es-CO")} ${s.unit}; falta relacionarlo con población y localización.`,
          "La diferencia conserva la unidad del servicio; no equivale automáticamente a personas distintas.",
        ],
        [
          "population",
          "La diferencia representa exactamente el número de personas que atenderá el proyecto.",
          "Una persona puede demandar varias unidades. Demanda insatisfecha y población objetivo requieren una relación explícita.",
        ],
        [
          "total",
          "La demanda completa debe convertirse en meta, porque la oferta existente no importa.",
          "La situación sin proyecto incluye oferta disponible y optimizaciones; ignorarla sobredimensiona la intervención.",
        ],
        [
          "growth",
          "Basta proyectar crecimiento poblacional para determinar el déficit actual.",
          "El crecimiento no sustituye medir oferta, demanda y capacidad efectiva en el mismo periodo.",
        ],
      ],
      "Déficit = demanda − oferta en unidades compatibles. La focalización requiere identificar población afectada, ubicación y consumo; no se deduce solo con una resta.",
      [
        "Comprueba primero las unidades.",
        "Distingue unidades de servicio y personas únicas.",
        "Resta oferta a demanda; después revisa a quién corresponde la brecha.",
      ],
    ),
    make(
      "npv",
      3,
      "VPN y costo de oportunidad",
      "Un módulo cuesta 1.000 M COP hoy y genera flujos netos reales de 600 M al final de cada uno de los próximos dos años. Sin residual y con tasa real del 10 %, ¿cuál es el VPN aproximado?",
      [
        ["reason", "41,32 M COP", "−1.000 + 600/1,10 + 600/1,10² = 41,32."],
        [
          "gross",
          "200 M COP",
          "200 es el saldo sin descuento; omite el valor temporal y el costo de oportunidad del capital.",
        ],
        [
          "once",
          "90,91 M COP",
          "Descontar ambos flujos una sola vez trata el segundo como si llegara en el primer año.",
        ],
        [
          "revenue",
          "1.041,32 M COP",
          "Esa es la suma descontada de entradas; el VPN también resta los 1.000 invertidos hoy.",
        ],
      ],
      "VPN = −1.000 + 600/1,10 + 600/1,21 = 41,32 M COP. Es un excedente sobre la tasa requerida, no ingreso bruto ni caja disponible hoy.",
      [
        "Dibuja los años 0, 1 y 2.",
        "Descuenta cada flujo según su año.",
        "Resta la inversión a 545,45 + 495,87.",
      ],
    ),
    make(
      "transfers",
      3,
      "Financiación y evaluación social",
      "El Consejo entrega un subsidio de 200 M para una obra. La obra ya registra su costo de recursos y sus beneficios de servicio. El subsidio es una transferencia entre residentes del ámbito evaluado. ¿Cómo tratarlo?",
      [
        [
          "reason",
          "Registrar su aporte a financiación sin añadir 200 M como beneficio social neto.",
          "La transferencia cambia quién paga; no crea por sí sola recursos ni beneficios adicionales.",
        ],
        [
          "double",
          "Sumar los 200 M como beneficio social y mantener intactos los beneficios del servicio.",
          "Así cuentas una transferencia interna como creación adicional de bienestar.",
        ],
        [
          "ignore",
          "Excluir el subsidio también del análisis de caja y de financiación.",
          "No genera beneficio social neto, pero sí cambia disponibilidad de caja y obligaciones del ejecutor.",
        ],
        [
          "loan",
          "Tratarlo como préstamo con amortización, aunque no haya obligación de devolución.",
          "Financiación no equivale siempre a deuda; utiliza las condiciones reales del aporte simulado.",
        ],
      ],
      "Separa flujo del proyecto, financiación y evaluación social. Una transferencia interna no es beneficio neto adicional; los costos administrativos o distorsiones, si se modelan, son conceptos diferentes.",
      [
        "Define primero el ámbito de la evaluación.",
        "Separa origen del dinero y uso de recursos.",
        "Verifica si alguien gana la transferencia y otro la pierde dentro del mismo ámbito.",
      ],
    ),
    make(
      "regulation",
      4,
      "Incentivos y efectos no deseados",
      "Una licencia exige una inversión fija de cumplimiento a todos los operadores. Mejora la seguridad, pero los nuevos entrantes atienden menos usuarios. ¿Qué debe comparar el regulador?",
      [
        [
          "reason",
          "Beneficio de seguridad frente a costos, barreras de entrada y distribución entre usuarios.",
          "Una regla puede aportar calidad y reducir competencia simultáneamente.",
        ],
        [
          "same",
          "Solo verificar que el requisito sea idéntico para todos.",
          "Un costo fijo idéntico puede pesar mucho más por usuario en un entrante pequeño.",
        ],
        [
          "hhi",
          "Aprobarla si baja el HHI, sin revisar calidad ni costos de cumplimiento.",
          "El HHI describe concentración; por sí solo no demuestra bienestar ni proporcionalidad.",
        ],
        [
          "price",
          "Eliminar la licencia si cualquier operador aumenta precios.",
          "Un precio mayor puede acompañar mejoras de seguridad: compara beneficios, costos y alternativas factibles.",
        ],
      ],
      "Compara no intervenir y diseños proporcionales. Explicita la falla, los incentivos y los efectos sobre entrada, calidad, costo y acceso. Los parámetros del simulador son educativos.",
      [
        "¿Es fijo o variable el costo?",
        "Reparte el costo entre usuarios de un operador grande y uno pequeño.",
        "Evalúa seguridad y competencia de manera conjunta.",
      ],
    ),
    make(
      "causality",
      6,
      "Seguimiento y atribución",
      `Durante ${s.title}, el acceso aumenta, pero también llega apoyo de otra organización. ¿Cómo interpretar el resultado?`,
      [
        [
          "reason",
          "Mantener la meta y distinguir contribución del proyecto, cambios externos y evidencia disponible.",
          "Observar una mejora no demuestra que toda sea atribuible al proyecto.",
        ],
        [
          "credit",
          "Atribuir toda la mejora al proyecto porque ocurrió durante su ejecución.",
          "La coincidencia temporal no excluye otras causas.",
        ],
        [
          "erase",
          "Descartar toda la mejora porque hubo apoyo externo.",
          "Puede existir contribución conjunta; documenta límites y mecanismos en lugar de borrar resultados.",
        ],
        [
          "money",
          "Usar porcentaje gastado como prueba de impacto causal.",
          "El gasto mide ejecución financiera; no demuestra por sí solo bienestar ni atribución.",
        ],
      ],
      "Conserva línea base, meta y fuentes. Contrasta lo esperado con lo observado y registra explicaciones externas. El simulador aproxima contribuciones; una evaluación causal real necesita un diseño apropiado.",
      [
        "Distingue evolución y atribución.",
        "Revisa qué cambió además del proyecto.",
        "Mantén el indicador original y documenta explicaciones alternativas.",
      ],
    ),
  ];
}
