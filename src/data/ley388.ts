/**
 * Ley 388 de 1997 (Ley de Desarrollo Territorial) de Colombia, as used by the simulator.
 * Content summarised from the compiled text (Régimen Legal de Bogotá / Función Pública). Aurora is a fictional
 * territory: the simulator applies this legal framework to it for learning purposes; the territorial data of each
 * mission (soil, plots, plusvalía) are simulated, never real cadastral data.
 */
export const ley388 = {
  title: "Ley 388 de 1997 · Ley de Desarrollo Territorial",
  reference: "Ley 388 del 18 de julio de 1997 (Diario Oficial 43.091). Modifica la Ley 9 de 1989 y la Ley 3 de 1991.",
  note: "Texto vigente con modificaciones posteriores, entre otras de las Leyes 810 de 2003, 902 de 2004, 2079 de 2021 y 2294 de 2023. Aurora es un territorio ficticio: el simulador le aplica este marco con fines educativos y sus datos territoriales son simulados.",
  source: "https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=339",
};

export interface LawSection {
  id: string;
  title: string;
  articles: string;
  points: string[];
  /** How the section shows up in the game. */
  inGame: string;
}
export const lawSections: LawSection[] = [
  {
    id: "principios",
    title: "Objeto y principios",
    articles: "Arts. 1 a 3",
    points: [
      "Busca que cada municipio ordene su territorio: uso equitativo y racional del suelo, preservación del patrimonio ecológico y cultural, prevención de desastres y acciones urbanísticas eficientes.",
      "Principios: función social y ecológica de la propiedad; prevalencia del interés general sobre el particular; distribución equitativa de las cargas y los beneficios.",
      "El urbanismo es una función pública: la administración decide sobre el uso del suelo para mejorar la calidad de vida y garantizar acceso a vías, servicios públicos y espacio público.",
    ],
    inGame: "Cada puzzle territorial aplica uno de estos principios: el interés general justifica adquirir suelo, y las cargas y beneficios explican la plusvalía.",
  },
  {
    id: "planes",
    title: "Planes de ordenamiento territorial",
    articles: "Arts. 9 a 11",
    points: [
      "Plan de Ordenamiento Territorial (POT): distritos y municipios con más de 100.000 habitantes.",
      "Plan Básico de Ordenamiento Territorial (PBOT): municipios entre 30.000 y 100.000 habitantes.",
      "Esquema de Ordenamiento Territorial (EOT): municipios con menos de 30.000 habitantes.",
      "Determinantes de superior jerarquía (art. 10): conservación del ambiente y prevención de amenazas y riesgos; áreas de producción de alimentos (Ley 2294 de 2023); patrimonio cultural; infraestructura vial, de transporte y de servicios públicos; planes metropolitanos.",
      "Todo plan tiene componente general, urbano y rural.",
    ],
    inGame: "El puzzle «Encaje en el ordenamiento» pide el instrumento que corresponde a la población del proyecto y el determinante que primero debes respetar.",
  },
  {
    id: "adopcion",
    title: "Adopción, vigencia y ejecución",
    articles: "Arts. 18, 19 y 24 a 28",
    points: [
      "El programa de ejecución define, para cada período de gobierno, las actuaciones obligatorias del plan y las conecta con el plan de inversiones del plan de desarrollo.",
      "Los planes parciales desarrollan el POT en áreas del suelo urbano y en todo el suelo de expansión urbana.",
      "El proyecto de plan se concerta con la autoridad ambiental (45 días, según la Ley 2079 de 2021) y recibe concepto del Consejo Territorial de Planeación (30 días hábiles). Si el Concejo no decide en 60 días, el alcalde puede adoptarlo por decreto.",
      "Vigencias: contenido estructural, tres períodos constitucionales; contenidos urbanos y rurales de mediano plazo, dos; contenidos de corto plazo, uno. Las revisiones siguen el mismo trámite de adopción.",
    ],
    inGame: "Si tu alternativa está en suelo de expansión, necesitas un plan parcial antes de urbanizar: el puzzle lo pregunta y, si lo omites, la licencia se demora al invertir.",
  },
  {
    id: "suelo",
    title: "Clases de suelo",
    articles: "Arts. 30 a 35",
    points: [
      "Suelo urbano (art. 31): áreas con infraestructura vial y redes de servicios públicos, dentro del perímetro urbano.",
      "Suelo de expansión urbana (art. 32): se habilitará para el uso urbano durante la vigencia del plan, según la previsión de crecimiento y la posibilidad de dotarlo de infraestructura.",
      "Suelo rural (art. 33): no apto para el uso urbano; destinado a usos agrícolas, ganaderos, forestales, de explotación de recursos naturales y actividades análogas.",
      "Suelo suburbano (art. 34): dentro del suelo rural, mezcla usos del campo y la ciudad; se desarrolla con restricciones de uso, intensidad y densidad, garantizando el autoabastecimiento de servicios públicos.",
      "Suelo de protección (art. 35): por sus características ambientales o paisajísticas, por ser zona de utilidad pública para servicios públicos o por amenaza y riesgo no mitigable, tiene restringida la posibilidad de urbanizarse.",
    ],
    inGame: "Cada alternativa de cada misión tiene un sitio con una clase de suelo distinta. Identificarla bien decide si puedes construir allí, qué trámite necesitas o si debes relocalizar.",
  },
  {
    id: "gestion",
    title: "Actuación urbanística y gestión del suelo",
    articles: "Arts. 36 a 39, 45 y 52 a 57",
    points: [
      "Las actuaciones urbanísticas son parcelación, urbanización y edificación; exigen cesiones gratuitas para vías locales, equipamientos colectivos y espacio público (art. 37).",
      "El POT debe garantizar el reparto equitativo de las cargas y los beneficios del ordenamiento (art. 38), por ejemplo mediante unidades de actuación urbanística (art. 39).",
      "El reajuste de tierras y la integración inmobiliaria reorganizan predios con el acuerdo de propietarios que representen el 51 % del área (art. 45).",
      "Los terrenos declarados de desarrollo o construcción prioritaria que no se desarrollen en el plazo legal van a enajenación forzosa en pública subasta (arts. 52 a 57).",
    ],
    inGame: "En la misión de vivienda, la ciudadela en suelo de expansión es el caso típico de plan parcial con reparto de cargas y beneficios.",
  },
  {
    id: "adquisicion",
    title: "Adquisición de inmuebles por motivos de utilidad pública",
    articles: "Arts. 58 a 72",
    points: [
      "El art. 58 declara de utilidad pública o interés social, entre otros: infraestructura social de salud, educación y seguridad (a); vivienda de interés social y reubicación por riesgo (b); renovación urbana y espacio público (c); servicios públicos domiciliarios (d); infraestructura vial y transporte masivo (e).",
      "Solo pueden adquirir por estos motivos la Nación, las entidades territoriales, las áreas metropolitanas y las entidades facultadas por ley (art. 59): un particular no expropia.",
      "Enajenación voluntaria (art. 61): precio con avalúo comercial, oferta de compra y negociación. Si no hay acuerdo en 30 días hábiles después de la oferta, procede la expropiación. Del precio se descuenta el mayor valor generado por el anuncio del proyecto.",
      "Expropiación por vía administrativa (arts. 63 a 65): solo con condiciones de urgencia declaradas, por criterios como evitar una elevación excesiva de los precios, el carácter inaplazable de la solución o las consecuencias lesivas de la demora.",
    ],
    inGame: "El puzzle «Ruta de adquisición de predios» pide ordenar los pasos y reconocer cuándo procede la expropiación. Una ruta irregular aumenta el riesgo de que los predios no estén liberados durante la ejecución.",
  },
  {
    id: "plusvalia",
    title: "Participación en la plusvalía",
    articles: "Arts. 73 a 90",
    points: [
      "Las acciones urbanísticas que aumentan el valor del suelo dan derecho al municipio a participar en esa plusvalía (art. 73).",
      "Hechos generadores (art. 74): incorporar suelo rural a expansión urbana o considerarlo suburbano; establecer o modificar el régimen o la zonificación de usos; autorizar un mayor aprovechamiento en edificación. También la ejecución de obras públicas previstas en el plan, cuando no se financian con contribución de valorización (art. 87).",
      "El Concejo fija la tasa de participación entre el 30 % y el 50 % del mayor valor por metro cuadrado (art. 79).",
      "Es exigible al solicitar licencia de urbanización o construcción, al cambiar efectivamente el uso, al transferir el dominio o al adquirir títulos de derechos adicionales (art. 83).",
      "Su destinación es específica (art. 85): vivienda de interés social, infraestructura vial, servicios públicos y equipamientos, espacio público, transporte masivo, renovación urbana, pago de inmuebles adquiridos por utilidad pública y patrimonio cultural.",
    ],
    inGame: "El puzzle «Plusvalía» pide identificar el hecho generador, liquidar la participación y decidir su destino. En un proyecto público bien liquidado, la plusvalía cofinancia la obra; en uno privado, es un costo que debes prever.",
  },
];

export type Soil = "urbano" | "expansion" | "rural" | "suburbano" | "proteccion";
export const soilName: Record<Soil, string> = {
  urbano: "Suelo urbano",
  expansion: "Suelo de expansión urbana",
  rural: "Suelo rural",
  suburbano: "Suelo suburbano",
  proteccion: "Suelo de protección",
};
/** What each class of soil requires before building (the correct answer of the third question). */
export const soilRequirement: Record<Soil, string> = {
  urbano: "Cumplir las normas urbanísticas del POT y obtener licencia de construcción",
  expansion: "Adoptar un plan parcial antes de urbanizar (art. 19)",
  rural: "Mantener un uso rural compatible; no se puede urbanizar el sitio",
  suburbano: "Desarrollar con restricciones de uso, intensidad y densidad, con autoabastecimiento de servicios (art. 34)",
  proteccion: "No urbanizar: relocalizar la obra o ajustar el diseño a un sitio compatible (art. 35)",
};
export type Generator = "ninguno" | "expansion" | "uso" | "aprovechamiento" | "obra";
export const generatorName: Record<Generator, string> = {
  expansion: "Incorporación de suelo rural a expansión urbana o a suburbano (art. 74, num. 1)",
  uso: "Establecimiento o modificación del régimen o la zonificación de usos (art. 74, num. 2)",
  aprovechamiento: "Autorización de un mayor aprovechamiento en edificación (art. 74, num. 3)",
  obra: "Ejecución de una obra pública prevista en el plan (art. 87)",
  ninguno: "No hay hecho generador de plusvalía",
};
export type Determinant = "ambiental" | "alimentos" | "patrimonio" | "infraestructura";
export const determinantName: Record<Determinant, string> = {
  ambiental: "Conservación del ambiente y prevención de amenazas y riesgos",
  alimentos: "Áreas de especial interés para la producción de alimentos",
  patrimonio: "Patrimonio cultural, histórico y arquitectónico",
  infraestructura: "Infraestructura vial, de transporte y de servicios públicos",
};
/** Utility motive of art. 58 that the project can invoke (none for private developers, who cannot expropriate). */
export type Motive = "a" | "b" | "c" | "d" | "e" | null;
export const motiveName: Record<Exclude<Motive, null>, string> = {
  a: "Infraestructura social: salud, educación, seguridad (art. 58, lit. a)",
  b: "Vivienda de interés social y reubicación por riesgo (art. 58, lit. b)",
  c: "Renovación urbana y espacio público (art. 58, lit. c)",
  d: "Servicios públicos domiciliarios (art. 58, lit. d)",
  e: "Infraestructura vial y transporte masivo (art. 58, lit. e)",
};

export interface SiteProfile {
  soil: Soil;
  /** Plots to acquire (0: public land or existing facilities). */
  plots: number;
  generator: Generator;
  /** Simulated description of the site: the player infers the class of soil from it. */
  site: string;
}
export interface TerritorialProfile {
  motive: Motive;
  determinant: Determinant;
  context: string;
  sites: [SiteProfile, SiteProfile, SiteProfile, SiteProfile];
}
/** Simulated territorial profile of each official mission, one site per alternative (same order). */
export const territorialProfiles: Record<string, TerritorialProfile> = {
  agua: {
    motive: "d",
    determinant: "ambiental",
    context: "La cuenca que abastece al municipio es un ecosistema estratégico: la autoridad ambiental concerta cualquier obra sobre ella.",
    sites: [
      { soil: "rural", plots: 14, generator: "obra", site: "Planta de tratamiento y conducción en veredas fuera del perímetro urbano, hoy con potreros y cultivos; la red nueva valoriza los predios que atraviesa." },
      { soil: "rural", plots: 6, generator: "ninguno", site: "Seis lotes pequeños junto a escuelas veredales, en zona agrícola alejada del casco urbano." },
      { soil: "urbano", plots: 0, generator: "ninguno", site: "Tanques y canaletas en las cubiertas de viviendas existentes del casco urbano, con redes y vías." },
      { soil: "urbano", plots: 4, generator: "obra", site: "Optimización de redes en barrios consolidados del perímetro urbano y cuatro lotes para módulos; las obras mejoran el servicio de los predios vecinos." },
    ],
  },
  movilidad: {
    motive: "e",
    determinant: "infraestructura",
    context: "Los corredores de alta demanda cruzan el centro consolidado: ampliar una vía exige adquirir franjas de muchos predios.",
    sites: [
      { soil: "urbano", plots: 60, generator: "obra", site: "Franjas de sesenta predios a lado y lado de avenidas del centro, con redes y equipamientos; la vía ampliada valoriza los frentes." },
      { soil: "urbano", plots: 25, generator: "obra", site: "Carriles exclusivos y estaciones sobre vías urbanas existentes, con veinticinco predios para estaciones y retornos." },
      { soil: "urbano", plots: 3, generator: "ninguno", site: "Ciclorrutas sobre andenes y separadores de vías urbanas; tres predios pequeños para cicloparqueaderos." },
      { soil: "urbano", plots: 30, generator: "obra", site: "Corredor de buses, ciclovías y estaciones de intercambio en el centro urbano consolidado; treinta predios." },
    ],
  },
  residuos: {
    motive: "d",
    determinant: "ambiental",
    context: "El sitio de disposición está cerca de quebradas y de veredas habitadas: la localización depende de la concertación ambiental.",
    sites: [
      { soil: "rural", plots: 8, generator: "ninguno", site: "Ampliación del relleno en terrenos agrícolas lejanos del perímetro urbano, ya previstos en el POT para disposición final." },
      { soil: "urbano", plots: 2, generator: "ninguno", site: "Bodegas en una zona industrial dentro del perímetro urbano, con vías y servicios." },
      { soil: "suburbano", plots: 5, generator: "ninguno", site: "Corredor vial interregional fuera del perímetro, donde se mezclan bodegas, fincas y vivienda campestre con servicios propios." },
      { soil: "urbano", plots: 3, generator: "ninguno", site: "Estaciones de clasificación y compostaje en lotes urbanos con redes, cerca de las rutas de recolección." },
    ],
  },
  salud: {
    motive: "a",
    determinant: "ambiental",
    context: "Parte del municipio está en zona de amenaza por remoción en masa: un hospital no puede quedar en riesgo no mitigable.",
    sites: [
      { soil: "urbano", plots: 2, generator: "ninguno", site: "Dos predios vecinos al hospital actual, en el centro urbano con redes de servicios." },
      { soil: "expansion", plots: 3, generator: "obra", site: "Lote de borde que el POT habilitará para uso urbano en su vigencia, aún sin redes; el hospital y sus vías valorizan los alrededores." },
      { soil: "rural", plots: 0, generator: "ninguno", site: "Puntos de atención en puestos de salud veredales existentes, en zona campesina." },
      { soil: "rural", plots: 5, generator: "ninguno", site: "Cinco sedes pequeñas para equipos territoriales en centros poblados rurales." },
    ],
  },
  planta: {
    motive: null,
    determinant: "ambiental",
    context: "La empresa es privada: compra suelo negociando y paga la plusvalía cuando una decisión urbanística valoriza su predio.",
    sites: [
      { soil: "expansion", plots: 3, generator: "expansion", site: "Terreno de borde que el municipio incorporó al suelo de expansión urbana para usos industriales, todavía sin urbanizar." },
      { soil: "urbano", plots: 0, generator: "ninguno", site: "La planta actual, en zona industrial urbana con vías y servicios." },
      { soil: "suburbano", plots: 2, generator: "uso", site: "Predio sobre un corredor interregional fuera del perímetro, al que el municipio asignó un uso industrial de bajo impacto." },
      { soil: "urbano", plots: 1, generator: "aprovechamiento", site: "Lote contiguo a la planta urbana, donde la norma nueva permite construir más pisos (mayor índice de construcción)." },
    ],
  },
  mercado: {
    motive: "d",
    determinant: "infraestructura",
    context: "El acceso compartido requiere ductos y nodos en vías públicas: la regulación del mercado también usa suelo.",
    sites: [
      { soil: "urbano", plots: 0, generator: "ninguno", site: "Oficinas existentes del regulador, en el centro urbano." },
      { soil: "urbano", plots: 0, generator: "ninguno", site: "Sedes administrativas existentes y trabajo de campo en el área urbana." },
      { soil: "urbano", plots: 4, generator: "obra", site: "Ductos y nodos de acceso abierto en vías urbanas, con cuatro predios para nodos; la infraestructura valoriza los predios conectados." },
      { soil: "urbano", plots: 2, generator: "ninguno", site: "Dos nodos de acceso en lotes urbanos con servicios." },
    ],
  },
  energia: {
    motive: "d",
    determinant: "ambiental",
    context: "Las cumbres del municipio tienen bosques de niebla que regulan el agua: el POT los protege.",
    sites: [
      { soil: "proteccion", plots: 6, generator: "ninguno", site: "Ladera de bosque de niebla que el POT conserva por su valor ambiental y por amenaza de deslizamiento; no admite urbanización." },
      { soil: "rural", plots: 3, generator: "ninguno", site: "Tres lotes en potreros de veredas, fuera del perímetro urbano." },
      { soil: "urbano", plots: 0, generator: "ninguno", site: "Redes existentes del casco urbano." },
      { soil: "rural", plots: 4, generator: "ninguno", site: "Cuatro lotes en zona agropecuaria para paneles y baterías." },
    ],
  },
  alimentos: {
    motive: null,
    determinant: "alimentos",
    context: "Las huertas están en suelos de alta capacidad agrícola, que el ordenamiento reserva para producir alimentos.",
    sites: [
      { soil: "rural", plots: 5, generator: "ninguno", site: "Cinco fincas de suelo agrícola fuera del perímetro, para riego mecanizado." },
      { soil: "rural", plots: 3, generator: "ninguno", site: "Tres fincas de vocación agrícola para invernaderos." },
      { soil: "suburbano", plots: 1, generator: "uso", site: "Lote sobre el corredor vial, al que el municipio asignó un uso de logística y almacenamiento." },
      { soil: "rural", plots: 2, generator: "ninguno", site: "Dos predios agrícolas para centros de acopio veredales." },
    ],
  },
  vivienda: {
    motive: "b",
    determinant: "ambiental",
    context: "Hay familias en zonas de riesgo no mitigable que deben reubicarse, y el municipio crece hacia su borde.",
    sites: [
      { soil: "expansion", plots: 20, generator: "expansion", site: "Veinte predios de borde que el POT incorporó al suelo de expansión urbana, aún sin redes; los propietarios reciben el mayor valor de la incorporación." },
      { soil: "urbano", plots: 4, generator: "ninguno", site: "Barrios existentes del perímetro urbano, con cuatro predios para reasentar familias en riesgo." },
      { soil: "urbano", plots: 10, generator: "ninguno", site: "Diez lotes vacíos dentro del perímetro urbano, con redes y vías." },
      { soil: "urbano", plots: 8, generator: "aprovechamiento", site: "Barrios con redes donde la norma nueva autoriza más pisos y se instalan módulos en ocho predios." },
    ],
  },
};
