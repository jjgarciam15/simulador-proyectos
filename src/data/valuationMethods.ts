/**
 * Biblioteca de metodologías de valoración económica.
 * Definitions follow MinAmbiente, Guía de aplicación de la valoración económica ambiental (Res. 1084 de 2018),
 * sections 8.1–8.7, and OECD (2018) Cost-Benefit Analysis and the Environment. See MANUAL_CREACION.md.
 */
export type MethodId =
  | "mercado"
  | "productividad"
  | "enfermedad"
  | "tiempo"
  | "viaje"
  | "hedonicos"
  | "gastos"
  | "contingente"
  | "eleccion"
  | "transferencia";
export type MethodFamily =
  | "Precios de mercado"
  | "Preferencias reveladas"
  | "Costos evitados o inducidos"
  | "Basados en gastos"
  | "Preferencias declaradas"
  | "Transferencia de beneficios";
export interface ValuationMethod {
  id: MethodId;
  name: string;
  family: MethodFamily;
  what: string;
  needs: string;
  when: string;
  whenNot: string;
  example: string;
  limitations: string;
}
export const valuationMethods: ValuationMethod[] = [
  {
    id: "mercado",
    name: "Precios de mercado",
    family: "Precios de mercado",
    what: "Valora el cambio con precios observados en un mercado que funciona para ese bien o servicio.",
    needs: "Cantidades del cambio y precios de mercado del bien (sin impuestos ni subsidios en la evaluación económica).",
    when: "El impacto es un bien que se compra y vende: ahorro de combustible, material reciclado vendido, alimentos no perdidos.",
    whenNot: "No hay mercado para el bien (calidad del aire, paisaje) o el precio está muy distorsionado.",
    example: "Energía: litros de diésel que ya no se queman × precio del diésel.",
    limitations: "Solo capta valores de uso con mercado; en la evaluación económica el precio debe ajustarse con RPC.",
  },
  {
    id: "productividad",
    name: "Cambios en la productividad",
    family: "Costos evitados o inducidos",
    what: "Mide cuánto cambia la producción de un bien con mercado cuando mejora o empeora un recurso o servicio que es insumo de esa producción.",
    needs: "Relación entre el recurso (agua, suelo, energía) y la producción, y el precio del bien producido.",
    when: "El proyecto mejora un insumo de actividades productivas: agua para huertas, energía para talleres.",
    whenNot: "El beneficio no pasa por la producción de un bien de mercado.",
    example: "Agua: aumento de la producción de las huertas × precio de venta de los productos.",
    limitations: "Requiere una función de producción o dosis-respuesta confiable; solo mide valor de uso.",
  },
  {
    id: "enfermedad",
    name: "Costo de la enfermedad",
    family: "Costos evitados o inducidos",
    what: "Valora la reducción de enfermedades con los costos médicos y los ingresos perdidos que se evitan.",
    needs: "Casos evitados (función dosis-respuesta o datos epidemiológicos), costos de tratamiento y días de trabajo perdidos.",
    when: "El proyecto reduce la incidencia de una enfermedad identificable.",
    whenNot: "Se quiere el valor total del bienestar de estar sano: el método lo subestima porque no incluye dolor ni sufrimiento.",
    example: "Salud: casos de enfermedad diarreica evitados × (consulta + medicamentos + días de trabajo perdidos).",
    limitations: "Es un límite inferior del valor de la salud; no incluye preferencias por evitar el riesgo.",
  },
  {
    id: "tiempo",
    name: "Valor del tiempo (costo de oportunidad)",
    family: "Precios de mercado",
    what: "Valora las horas ahorradas con el costo de oportunidad del tiempo, a partir del salario que se deja de ganar.",
    needs: "Horas ahorradas por persona, número de personas y un valor horario (una fracción del salario para tiempo no laboral).",
    when: "El impacto es ahorro de tiempo: viajes más cortos, menos acarreo de agua, menos esperas.",
    whenNot: "El tiempo ahorrado no puede usarse en otra actividad o el efecto ya está en otro beneficio valorado.",
    example: "Movilidad: 15 minutos menos por viaje × viajes al año × valor de la hora.",
    limitations: "El valor del tiempo no laboral es un supuesto; conviene analizar su sensibilidad.",
  },
  {
    id: "viaje",
    name: "Costo de viaje",
    family: "Preferencias reveladas",
    what: "Usa los gastos y el tiempo que las personas invierten para visitar un sitio como el precio mínimo que están dispuestas a pagar por disfrutarlo.",
    needs: "Visitas por zona de origen, distancias, costos de transporte, tiempo, gastos en el sitio e ingreso de los visitantes.",
    when: "Sitios de recreación, turismo y esparcimiento: parques, reservas, playas, humedales.",
    whenNot: "El bien no se visita (valores de no uso) o el viaje tiene varios propósitos.",
    example: "Humedal recuperado: con encuestas a visitantes se estima la curva de demanda y el excedente del consumidor.",
    limitations: "Solo mide valor de uso recreativo; exige que la visita sea el motivo principal del viaje e incluir el costo del tiempo.",
  },
  {
    id: "hedonicos",
    name: "Precios hedónicos",
    family: "Preferencias reveladas",
    what: "Estima cuánto de un precio observado (vivienda o salario) se explica por una característica ambiental o de acceso.",
    needs: "Muchas transacciones de viviendas (o salarios) con sus características: tamaño, ubicación, acceso, ruido, calidad ambiental.",
    when: "Hay un mercado inmobiliario activo y la característica (ruido, acceso, calidad del aire) cambia el precio.",
    whenNot: "No hay registros de transacciones o el cambio es muy pequeño para reflejarse en precios.",
    example: "Movilidad: diferencia de precio de viviendas cercanas y lejanas al corredor, con todo lo demás constante.",
    limitations: "Riesgo de variables omitidas y de doble conteo: el valor de la propiedad puede capitalizar beneficios ya valorados.",
  },
  {
    id: "gastos",
    name: "Gastos de prevención, restauración, reemplazo y mitigación",
    family: "Basados en gastos",
    what: "Aproxima el valor de un daño o de su prevención con lo que costaría prevenirlo, mitigarlo, restaurarlo o reemplazar el servicio perdido.",
    needs: "Costos de las medidas técnicas necesarias, preferiblemente costos oficiales de referencia.",
    when: "Impactos ambientales negativos cuando no hay información para medir el daño en bienestar.",
    whenNot: "Se necesita una medida exacta del bienestar: el costo de reponer no siempre equivale al valor perdido.",
    example: "Residuos: costo de tratar los lixiviados para devolver el agua a su calidad anterior.",
    limitations: "No es una medida técnicamente correcta del valor económico; es una aproximación útil con recursos escasos.",
  },
  {
    id: "contingente",
    name: "Valoración contingente",
    family: "Preferencias declaradas",
    what: "Pregunta directamente a las personas, en un escenario hipotético bien descrito, su disposición a pagar por un cambio o a aceptar una compensación.",
    needs: "Encuesta con escenario creíble, visita de campo, prueba piloto y muestra representativa.",
    when: "No hay comportamiento observable que revele el valor, o importan los valores de no uso.",
    whenNot: "Existe un mercado o comportamiento observable suficiente; la población no conoce el bien.",
    example: "Agua: disposición a pagar de los hogares por un servicio continuo, estimada con una encuesta tipo referendo.",
    limitations: "Sesgos hipotético, estratégico y del encuestador; la disposición a pagar está limitada por el ingreso.",
  },
  {
    id: "eleccion",
    name: "Experimentos de elección y valoración conjoint",
    family: "Preferencias declaradas",
    what: "Presenta alternativas que combinan atributos con distintos niveles y un costo; de las elecciones se deduce el valor de cada atributo.",
    needs: "Atributos y niveles realistas, diseño experimental, encuesta piloto y modelo econométrico.",
    when: "El bien tiene varios atributos y se necesita conocer sus trade-offs: frecuencia, tiempo, comodidad, precio.",
    whenNot: "Hay un solo atributo simple o la población no puede comparar muchos escenarios.",
    example: "Movilidad: elegir entre rutas con distinto tiempo, frecuencia, seguridad y tarifa.",
    limitations: "Más de seis escenarios por persona reduce la calidad de las respuestas; comparte los sesgos de la valoración contingente.",
  },
  {
    id: "transferencia",
    name: "Transferencia de beneficios",
    family: "Transferencia de beneficios",
    what: "Adapta valores de estudios previos de alta calidad a un contexto nuevo. No es un método de valoración en sí mismo.",
    needs: "Estudios de base sobre el mismo servicio, con población, área y condiciones socioeconómicas comparables.",
    when: "No hay tiempo o recursos para un estudio primario y existen estudios comparables.",
    whenNot: "El contexto es muy distinto o los estudios de base son débiles.",
    example: "Energía: valor por tonelada de CO₂ evitada tomado de estudios de referencia.",
    limitations: "Error de transferencia; la función de transferencia es más confiable que transferir un valor fijo.",
  },
];
export const methodById = (id: string) => valuationMethods.find((m) => m.id === id);
/** Guided decision tree (a guide, not a universal rule). */
export const valuationDecisionTree = [
  { question: "¿Existe un precio observable para el bien o servicio?", yes: "Precios de mercado (ajustados con RPC en el flujo económico).", no: "Continúa." },
  { question: "¿Hay un comportamiento observable relacionado (viajes, compra de vivienda, gastos)?", yes: "Preferencias reveladas: costo de viaje o precios hedónicos.", no: "Continúa." },
  { question: "¿El impacto cambia la producción, la salud o los costos de alguien?", yes: "Costos evitados o inducidos: productividad o costo de la enfermedad.", no: "Continúa." },
  { question: "¿Necesitas preguntar directamente, o importan valores de no uso?", yes: "Preferencias declaradas: valoración contingente o experimentos de elección.", no: "Continúa." },
  { question: "¿Hay estudios comparables de buena calidad?", yes: "Transferencia de beneficios, con ajustes al contexto.", no: "Continúa." },
  { question: "¿Puede aproximarse con lo que costaría prevenir, restaurar o reemplazar?", yes: "Métodos basados en gastos, reconociendo que son una aproximación.", no: "Documenta el impacto de forma cualitativa." },
];
