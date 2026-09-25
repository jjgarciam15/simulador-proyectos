/**
 * Efectos e impactos por misión. Each card has a correct classification and, when it is valuable,
 * the information needed to measure and value it. Shares express the part of the alternative's annual
 * social benefit (or damage) explained by the impact, so valuation stays consistent with the mission data.
 * Cards with the same `overlap` key partially represent the same benefit (double counting trap).
 */
export type ImpactKind =
  | "producto"
  | "efecto"
  | "impactoPositivo"
  | "impactoNegativo"
  | "problema"
  | "irrelevante";
export type Beneficiary =
  | "Usuarios"
  | "Consumidores"
  | "Productores"
  | "Gobierno"
  | "Comunidad"
  | "Trabajadores"
  | "Población objetivo"
  | "Terceros";
export type ImpactType =
  | "salud"
  | "tiempo"
  | "productividad"
  | "propiedad"
  | "recreacion"
  | "ahorro"
  | "ambiente"
  | "emisiones"
  | "variedad";
export interface ImpactValuation {
  type: ImpactType;
  share: number;
  /** Unit of the measurement and quantity per covered person per year. */
  unit: string;
  perCovered: number;
  /** Information that the case provides (used to judge method feasibility). */
  data: string;
  overlap?: string;
  sdg: number[];
}
export interface ImpactCardData {
  id: string;
  text: string;
  kind: ImpactKind;
  group?: Beneficiary;
  why: string;
  valuation?: ImpactValuation;
}
const employment: ImpactCardData = {
  id: "empleo",
  text: "Empleos temporales durante la construcción",
  kind: "efecto",
  group: "Trabajadores",
  why: "Es un efecto real, pero en la evaluación económica el trabajo es un costo que se ajusta con RPC; sumarlo como beneficio sería doble conteo.",
};
export const missionImpacts: Record<string, ImpactCardData[]> = {
  agua: [
    { id: "horas", text: "Más horas de suministro continuo por hogar", kind: "efecto", group: "Usuarios", why: "Cambio directo que produce el servicio: se mide en horas, todavía no en pesos." },
    { id: "perdidas", text: "Menos pérdidas de agua en la red", kind: "efecto", group: "Gobierno", why: "Efecto técnico del proyecto sobre la operación." },
    { id: "salud", text: "Menos casos de enfermedades asociadas al agua", kind: "impactoPositivo", group: "Usuarios", why: "Cambio en el bienestar de la población gracias al servicio.", valuation: { type: "salud", share: 0.35, unit: "casos evitados", perCovered: 0.06, data: "El hospital reporta costos promedio de consulta y tratamiento y días de incapacidad.", sdg: [3, 6] } },
    { id: "acarreo", text: "Menos horas dedicadas a acarrear agua", kind: "impactoPositivo", group: "Población objetivo", why: "El tiempo liberado puede dedicarse a trabajo o estudio.", valuation: { type: "tiempo", share: 0.3, unit: "horas", perCovered: 45, data: "Encuesta de hogares con horas de acarreo y salario rural de referencia.", sdg: [5, 6] } },
    { id: "huertas", text: "Más producción en huertas y pequeños negocios", kind: "impactoPositivo", group: "Productores", why: "El agua es insumo de producción con mercado.", valuation: { type: "productividad", share: 0.35, unit: "toneladas", perCovered: 0.01, data: "Registros de producción y precios de venta en la plaza de mercado.", sdg: [2, 8] } },
    { id: "vivienda", text: "Mayor valor de las viviendas conectadas", kind: "impactoPositivo", group: "Comunidad", why: "Puede existir, pero el precio de la vivienda capitaliza la salud y el tiempo ya valorados.", valuation: { type: "propiedad", share: 0.4, unit: "viviendas", perCovered: 0.25, data: "Hay pocas transacciones registradas de vivienda rural.", overlap: "bienestar-hogar", sdg: [11] } },
    { id: "caudal", text: "Menor caudal ecológico en la fuente", kind: "impactoNegativo", group: "Terceros", why: "Costo ambiental que soportan terceros y el ecosistema.", valuation: { type: "ambiente", share: 0.06, unit: "hectáreas afectadas", perCovered: 0.002, data: "La autoridad ambiental tiene costos de referencia para medidas de restauración.", sdg: [6, 15] } },
    { id: "placa", text: "Placa conmemorativa en la planta", kind: "irrelevante", why: "No cambia el bienestar ni el servicio." },
    employment,
  ],
  movilidad: [
    { id: "trayecto", text: "Menor tiempo por trayecto en el corredor", kind: "efecto", group: "Usuarios", why: "Efecto medible en minutos, previo a la valoración." },
    { id: "colectivo", text: "Más viajes en transporte colectivo", kind: "efecto", group: "Usuarios", why: "Cambio de comportamiento producido por el proyecto." },
    { id: "horas", text: "Horas de viaje ahorradas por los usuarios", kind: "impactoPositivo", group: "Usuarios", why: "El tiempo ahorrado tiene costo de oportunidad.", valuation: { type: "tiempo", share: 0.5, unit: "horas", perCovered: 60, data: "Aforos de viajes, encuesta origen-destino y salarios de referencia.", sdg: [11] } },
    { id: "respiratorias", text: "Menos enfermedades respiratorias por menor contaminación", kind: "impactoPositivo", group: "Comunidad", why: "Impacto en salud de la población expuesta.", valuation: { type: "salud", share: 0.2, unit: "casos evitados", perCovered: 0.01, data: "Registros de consultas respiratorias y costos de atención.", sdg: [3, 11] } },
    { id: "operacion", text: "Menores costos de operación vehicular", kind: "impactoPositivo", group: "Usuarios", why: "Ahorro de combustible y mantenimiento con precios de mercado.", valuation: { type: "ahorro", share: 0.3, unit: "litros de combustible", perCovered: 20, data: "Consumo por kilómetro y precios de combustible.", sdg: [7, 11] } },
    { id: "predios", text: "Mayor valor de predios cerca del corredor", kind: "impactoPositivo", group: "Comunidad", why: "Refleja en buena parte el ahorro de tiempo ya valorado.", valuation: { type: "propiedad", share: 0.35, unit: "predios", perCovered: 0.05, data: "El catastro tiene transacciones inmobiliarias recientes.", overlap: "accesibilidad", sdg: [11] } },
    { id: "ruido", text: "Ruido y desvíos durante la obra", kind: "impactoNegativo", group: "Terceros", why: "Costo temporal para comerciantes y vecinos.", valuation: { type: "ambiente", share: 0.05, unit: "meses de afectación", perCovered: 0.0005, data: "Costos de referencia de medidas de mitigación de ruido y señalización.", sdg: [11] } },
    { id: "paraderos", text: "Cambio de color de los paraderos", kind: "irrelevante", why: "No altera el servicio ni el bienestar." },
    employment,
  ],
  residuos: [
    { id: "toneladas", text: "Toneladas dispuestas de forma adecuada", kind: "efecto", group: "Comunidad", why: "Efecto físico del servicio, medido en toneladas." },
    { id: "aprovechado", text: "Más material aprovechado", kind: "efecto", group: "Productores", why: "Cambio en el flujo de residuos producido por el proyecto." },
    { id: "disposicion", text: "Menor costo de disposición final por tonelada", kind: "impactoPositivo", group: "Gobierno", why: "Costo evitado con precios de mercado del servicio.", valuation: { type: "ahorro", share: 0.35, unit: "toneladas", perCovered: 0.05, data: "Tarifas de disposición del relleno regional.", sdg: [11, 12] } },
    { id: "vecinos", text: "Menos enfermedades en barrios vecinos al relleno", kind: "impactoPositivo", group: "Comunidad", why: "Impacto en salud de la población expuesta.", valuation: { type: "salud", share: 0.3, unit: "casos evitados", perCovered: 0.02, data: "Secretaría de Salud con costos por consulta y hospitalización.", sdg: [3] } },
    { id: "humedal", text: "Visitas recreativas al humedal recuperado", kind: "impactoPositivo", group: "Comunidad", why: "Valor de uso recreativo del sitio restaurado.", valuation: { type: "recreacion", share: 0.35, unit: "visitas", perCovered: 1.5, data: "Conteo de visitantes por barrio de origen y costos de transporte.", sdg: [15, 11] } },
    { id: "predios", text: "Recuperación del valor de predios vecinos", kind: "impactoPositivo", group: "Comunidad", why: "Parte de este aumento refleja la salud y el paisaje ya valorados.", valuation: { type: "propiedad", share: 0.35, unit: "predios", perCovered: 0.05, data: "Transacciones inmobiliarias escasas en la zona.", overlap: "entorno", sdg: [11] } },
    { id: "lixiviados", text: "Emisiones y lixiviados residuales", kind: "impactoNegativo", group: "Terceros", why: "Daño ambiental remanente que soportan terceros.", valuation: { type: "ambiente", share: 0.07, unit: "m³ de lixiviado", perCovered: 0.3, data: "Costos de referencia de tratamiento de lixiviados.", sdg: [6, 12] } },
    { id: "logo", text: "Nuevo logotipo del operador", kind: "irrelevante", why: "No cambia el servicio ni el bienestar." },
    employment,
  ],
  salud: [
    { id: "consultas", text: "Más consultas resueltas en atención primaria", kind: "efecto", group: "Usuarios", why: "Efecto del servicio, medido en consultas." },
    { id: "traslados", text: "Menos traslados urgentes al hospital", kind: "efecto", group: "Usuarios", why: "Cambio en el uso de la red." },
    { id: "complicaciones", text: "Menos complicaciones por enfermedades prevenibles", kind: "impactoPositivo", group: "Población objetivo", why: "Impacto en salud de la población atendida.", valuation: { type: "salud", share: 0.45, unit: "casos evitados", perCovered: 0.03, data: "Costos de tratamiento, medicamentos e incapacidades.", sdg: [3] } },
    { id: "viajes", text: "Horas de viaje evitadas por pacientes rurales", kind: "impactoPositivo", group: "Población objetivo", why: "Tiempo liberado con costo de oportunidad.", valuation: { type: "tiempo", share: 0.3, unit: "horas", perCovered: 8, data: "Encuesta de tiempos de desplazamiento y salario rural.", sdg: [3, 10] } },
    { id: "urgencias", text: "Menores costos hospitalarios por urgencias evitables", kind: "impactoPositivo", group: "Gobierno", why: "Ya forma parte del costo de la enfermedad evitado.", valuation: { type: "ahorro", share: 0.25, unit: "urgencias evitadas", perCovered: 0.02, data: "Costos de urgencias del hospital.", overlap: "costo-enfermedad", sdg: [3] } },
    { id: "resiliencia", text: "Mejor preparación de la red ante emergencias", kind: "impactoPositivo", group: "Comunidad", why: "Valor que la población asigna a contar con atención oportuna.", valuation: { type: "variedad", share: 0.25, unit: "hogares", perCovered: 0.25, data: "Se puede diseñar una encuesta con atributos: distancia, espera y horario.", sdg: [3, 11] } },
    { id: "residuos", text: "Residuos hospitalarios adicionales", kind: "impactoNegativo", group: "Terceros", why: "Daño ambiental por manejo de residuos peligrosos.", valuation: { type: "ambiente", share: 0.04, unit: "toneladas", perCovered: 0.0005, data: "Costos de referencia de gestión de residuos peligrosos.", sdg: [12] } },
    { id: "uniformes", text: "Uniformes nuevos para el personal", kind: "irrelevante", why: "No cambia la atención ni el bienestar." },
    employment,
  ],
  planta: [
    { id: "procesadas", text: "Más toneladas procesadas por año", kind: "efecto", group: "Productores", why: "Efecto productivo medido en toneladas." },
    { id: "intensidad", text: "Menos emisiones por unidad producida", kind: "efecto", group: "Comunidad", why: "Cambio técnico, medido antes de valorar." },
    { id: "ventas", text: "Mayor producción vendida", kind: "impactoPositivo", group: "Productores", why: "Beneficio valorado con precios de venta.", valuation: { type: "productividad", share: 0.45, unit: "toneladas", perCovered: 0.02, data: "Precios de venta y contratos con compradores.", sdg: [8, 9] } },
    { id: "energia", text: "Menor consumo de energía por unidad", kind: "impactoPositivo", group: "Productores", why: "Costo evitado con precio de mercado de la energía.", valuation: { type: "ahorro", share: 0.25, unit: "MWh", perCovered: 0.005, data: "Facturas de energía y tarifas industriales.", sdg: [7, 9] } },
    { id: "respiratorias", text: "Menos afectaciones respiratorias en el vecindario", kind: "impactoPositivo", group: "Comunidad", why: "Impacto en salud de terceros.", valuation: { type: "salud", share: 0.3, unit: "casos evitados", perCovered: 0.01, data: "Consultas respiratorias del centro de salud cercano.", sdg: [3] } },
    { id: "predios", text: "Mayor valor de las viviendas vecinas", kind: "impactoPositivo", group: "Comunidad", why: "Capitaliza la mejora ambiental ya valorada en salud.", valuation: { type: "propiedad", share: 0.3, unit: "viviendas", perCovered: 0.05, data: "Pocas transacciones inmobiliarias registradas.", overlap: "vecindario", sdg: [11] } },
    { id: "vertimientos", text: "Vertimientos residuales al río", kind: "impactoNegativo", group: "Terceros", why: "Externalidad negativa sobre usuarios aguas abajo.", valuation: { type: "ambiente", share: 0.08, unit: "m³ vertidos", perCovered: 0.2, data: "Costos de tratamiento de aguas residuales de referencia.", sdg: [6, 14] } },
    { id: "cafeteria", text: "Nueva cafetería para visitantes", kind: "irrelevante", why: "No cambia la producción ni el bienestar evaluado." },
    employment,
  ],
  mercado: [
    { id: "oferentes", text: "Más oferentes activos en el mercado", kind: "efecto", group: "Productores", why: "Cambio en la estructura del mercado." },
    { id: "precio", text: "Menor precio promedio", kind: "efecto", group: "Consumidores", why: "Efecto medible del proyecto, previo a valorar." },
    { id: "ahorro", text: "Ahorro de los consumidores por menores precios", kind: "impactoPositivo", group: "Consumidores", why: "Ganancia de excedente del consumidor con precios observados.", valuation: { type: "ahorro", share: 0.45, unit: "compras", perCovered: 12, data: "Precios y cantidades registrados por la superintendencia.", sdg: [10, 16] } },
    { id: "variedad", text: "Mayor variedad y calidad percibida", kind: "impactoPositivo", group: "Consumidores", why: "Valor de atributos sin precio directo.", valuation: { type: "variedad", share: 0.3, unit: "hogares", perCovered: 0.25, data: "Se puede aplicar una encuesta con atributos y precios.", sdg: [12] } },
    { id: "busqueda", text: "Menos tiempo buscando proveedores confiables", kind: "impactoPositivo", group: "Consumidores", why: "Ahorro de tiempo con costo de oportunidad.", valuation: { type: "tiempo", share: 0.25, unit: "horas", perCovered: 3, data: "Encuesta de tiempos de compra y salarios.", sdg: [16] } },
    { id: "bienestar", text: "Mayor bienestar del consumidor por menor precio", kind: "impactoPositivo", group: "Consumidores", why: "Es el mismo ahorro por menores precios con otro nombre.", valuation: { type: "ahorro", share: 0.45, unit: "compras", perCovered: 12, data: "Mismos datos de precios y cantidades.", overlap: "precio", sdg: [10] } },
    { id: "margen", text: "Menores márgenes de la empresa dominante", kind: "efecto", group: "Productores", why: "Es en gran parte una transferencia hacia los consumidores, no una pérdida social: se analiza en la evaluación distributiva." },
    { id: "cumplimiento", text: "Costos de cumplimiento para pequeños oferentes", kind: "impactoNegativo", group: "Productores", why: "Costo real de la regulación.", valuation: { type: "ambiente", share: 0.06, unit: "empresas", perCovered: 0.001, data: "Costos administrativos de trámites de referencia.", sdg: [8] } },
    { id: "logo", text: "Nueva imagen institucional del regulador", kind: "irrelevante", why: "No cambia el mercado ni el bienestar." },
  ],
  energia: [
    { id: "horas", text: "Más horas de servicio eléctrico por hogar", kind: "efecto", group: "Usuarios", why: "Efecto directo, medido en horas." },
    { id: "diesel", text: "Menos consumo de diésel en generadores", kind: "efecto", group: "Usuarios", why: "Cambio físico previo a la valoración." },
    { id: "combustible", text: "Gasto evitado en combustible y velas", kind: "impactoPositivo", group: "Usuarios", why: "Costo evitado con precios de mercado.", valuation: { type: "ahorro", share: 0.35, unit: "litros", perCovered: 30, data: "Precios del diésel y de las velas en el mercado local.", sdg: [7] } },
    { id: "negocios", text: "Negocios que amplían su horario de atención", kind: "impactoPositivo", group: "Productores", why: "La energía es insumo de producción.", valuation: { type: "productividad", share: 0.3, unit: "horas de venta", perCovered: 20, data: "Ventas por hora de los negocios de la plaza.", sdg: [8] } },
    { id: "humo", text: "Menos enfermedades respiratorias por humo en interiores", kind: "impactoPositivo", group: "Usuarios", why: "Impacto en salud de los hogares.", valuation: { type: "salud", share: 0.2, unit: "casos evitados", perCovered: 0.02, data: "Costos de tratamiento de enfermedades respiratorias.", sdg: [3] } },
    { id: "co2", text: "Menos emisiones de CO₂", kind: "impactoPositivo", group: "Terceros", why: "Beneficio global por menor quema de combustibles.", valuation: { type: "emisiones", share: 0.15, unit: "toneladas de CO₂", perCovered: 0.08, data: "Estudios de referencia sobre el valor social del carbono.", sdg: [13] } },
    { id: "factura", text: "Ahorro de los hogares en su factura de energía", kind: "impactoPositivo", group: "Usuarios", why: "Es el mismo gasto evitado en combustible visto desde la factura.", valuation: { type: "ahorro", share: 0.35, unit: "litros", perCovered: 30, data: "Mismos precios de combustible.", overlap: "gasto-energetico", sdg: [7] } },
    { id: "vegetal", text: "Pérdida de cobertura vegetal en el trazado de redes", kind: "impactoNegativo", group: "Terceros", why: "Daño ambiental por la construcción.", valuation: { type: "ambiente", share: 0.05, unit: "hectáreas", perCovered: 0.001, data: "Costos de referencia de restauración ecológica.", sdg: [15] } },
    employment,
  ],
  alimentos: [
    { id: "procesados", text: "Más toneladas de alimentos procesados", kind: "efecto", group: "Productores", why: "Efecto productivo previo a la valoración." },
    { id: "poscosecha", text: "Menos pérdidas poscosecha", kind: "efecto", group: "Productores", why: "Cambio físico, medido en toneladas." },
    { id: "ventas", text: "Mayores ventas de los productores asociados", kind: "impactoPositivo", group: "Productores", why: "Beneficio con precios de mercado.", valuation: { type: "productividad", share: 0.5, unit: "toneladas", perCovered: 0.03, data: "Precios de venta en la central de abastos.", sdg: [2, 8] } },
    { id: "desperdicio", text: "Menos alimentos desperdiciados", kind: "impactoPositivo", group: "Productores", why: "El alimento que no se pierde es el mismo que se vende: ya está en las ventas.", valuation: { type: "ahorro", share: 0.4, unit: "toneladas", perCovered: 0.02, data: "Mismos precios de venta.", overlap: "produccion", sdg: [12] } },
    { id: "nutricion", text: "Mejor nutrición en hogares de la región", kind: "impactoPositivo", group: "Comunidad", why: "Impacto en bienestar sin mercado directo.", valuation: { type: "salud", share: 0.3, unit: "casos evitados", perCovered: 0.01, data: "Estudios previos de desnutrición y costos de atención.", sdg: [2, 3] } },
    { id: "precios", text: "Precios más estables para los consumidores", kind: "impactoPositivo", group: "Consumidores", why: "Ahorro observable en compras.", valuation: { type: "ahorro", share: 0.2, unit: "compras", perCovered: 6, data: "Series de precios de la central de abastos.", sdg: [2] } },
    { id: "camiones", text: "Mayor tráfico de camiones en la vereda", kind: "impactoNegativo", group: "Terceros", why: "Costo para vecinos: ruido, polvo y desgaste vial.", valuation: { type: "ambiente", share: 0.05, unit: "viajes de camión", perCovered: 0.02, data: "Costos de referencia de mitigación vial.", sdg: [11] } },
    { id: "empaque", text: "Nuevo diseño de las cajas de empaque", kind: "irrelevante", why: "No cambia la producción ni el bienestar." },
    employment,
  ],
  vivienda: [
    { id: "hacinamiento", text: "Menos hogares en hacinamiento", kind: "efecto", group: "Población objetivo", why: "Efecto medible en hogares, previo a valorar." },
    { id: "reparaciones", text: "Menos reparaciones de emergencia", kind: "efecto", group: "Población objetivo", why: "Cambio en el uso de recursos de los hogares." },
    { id: "humedad", text: "Menos enfermedades por humedad y hacinamiento", kind: "impactoPositivo", group: "Población objetivo", why: "Impacto en salud de los hogares.", valuation: { type: "salud", share: 0.35, unit: "casos evitados", perCovered: 0.04, data: "Costos de atención de enfermedades respiratorias y de piel.", sdg: [3] } },
    { id: "gasto", text: "Menor gasto de los hogares en reparaciones", kind: "impactoPositivo", group: "Población objetivo", why: "Ahorro con precios de mercado de materiales y mano de obra.", valuation: { type: "ahorro", share: 0.3, unit: "reparaciones", perCovered: 0.3, data: "Precios de materiales y jornales locales.", sdg: [11] } },
    { id: "estudio", text: "Más horas de estudio en casa para niños y jóvenes", kind: "impactoPositivo", group: "Población objetivo", why: "Tiempo útil que antes se perdía.", valuation: { type: "tiempo", share: 0.35, unit: "horas", perCovered: 30, data: "Encuesta de uso del tiempo del hogar.", sdg: [4] } },
    { id: "valor", text: "Mayor valor de las viviendas mejoradas", kind: "impactoPositivo", group: "Población objetivo", why: "El precio capitaliza la salud y el ahorro ya valorados.", valuation: { type: "propiedad", share: 0.45, unit: "viviendas", perCovered: 0.25, data: "Avalúos catastrales y transacciones del barrio.", overlap: "vivienda", sdg: [11] } },
    { id: "escombros", text: "Escombros generados por la obra", kind: "impactoNegativo", group: "Terceros", why: "Daño ambiental temporal por disposición de escombros.", valuation: { type: "ambiente", share: 0.04, unit: "m³ de escombros", perCovered: 0.05, data: "Costos de referencia de disposición de escombros.", sdg: [11, 12] } },
    { id: "fachada", text: "Color uniforme de las fachadas", kind: "irrelevante", why: "Estético; no cambia el bienestar evaluado." },
    employment,
  ],
};
/** Fit of each method by impact type (anything not listed is inadequate). */
export const methodFit: Record<ImpactType, Partial<Record<string, "optima" | "valida" | "parcial">>> = {
  salud: { enfermedad: "optima", contingente: "valida", transferencia: "valida", gastos: "parcial" },
  tiempo: { tiempo: "optima", eleccion: "valida", transferencia: "valida", contingente: "parcial" },
  productividad: { productividad: "optima", mercado: "valida", transferencia: "parcial" },
  propiedad: { hedonicos: "optima", transferencia: "parcial", contingente: "parcial" },
  recreacion: { viaje: "optima", contingente: "valida", eleccion: "valida", transferencia: "valida" },
  ahorro: { mercado: "optima", gastos: "parcial", transferencia: "parcial" },
  ambiente: { gastos: "optima", contingente: "valida", eleccion: "valida", transferencia: "valida", productividad: "parcial" },
  emisiones: { transferencia: "optima", mercado: "valida", gastos: "parcial" },
  variedad: { eleccion: "optima", contingente: "valida", transferencia: "parcial" },
};
/** Why a method fits or not, by impact type, for feedback that goes beyond right/wrong. */
export const fitReason: Record<ImpactType, string> = {
  salud: "La salud no tiene precio de mercado directo. El costo de la enfermedad usa costos observables (límite inferior); las preferencias declaradas pueden captar el valor total.",
  tiempo: "El ahorro de tiempo se valora con su costo de oportunidad; los experimentos de elección permiten estimar cuánto se valora cada minuto frente a otros atributos.",
  productividad: "El recurso es insumo de un bien con mercado: el cambio en la producción valorado a precios de mercado mide el beneficio.",
  propiedad: "Si hay transacciones suficientes, el precio hedónico separa el efecto de la característica. Cuidado: el precio puede capitalizar beneficios ya valorados.",
  recreacion: "Las personas revelan cuánto valoran un sitio con los costos y el tiempo que invierten en visitarlo.",
  ahorro: "Es un costo evitado con precios observables en el mercado.",
  ambiente: "Sin mercado directo, los gastos de prevención, restauración o mitigación aproximan el daño; las preferencias declaradas capturan mejor el bienestar perdido.",
  emisiones: "El daño es global y difícil de medir localmente: se transfieren valores de referencia del costo social del carbono.",
  variedad: "Es un conjunto de atributos sin precio: los experimentos de elección revelan cuánto vale cada atributo.",
};
