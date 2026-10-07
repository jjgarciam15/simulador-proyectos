/**
 * Extra cards for the problem tree that the player builds (V2 games).
 * Per mission: three more valid cards (another direct cause, another indirect cause, another effect),
 * the direct cause the extra indirect one hangs from, and a mission-specific trap. Generic traps are added in src/domain/problemTree.ts.
 */
export interface MissionTreeCards {
  direct: string;
  indirect: string;
  effect: string;
  /** Plausible but wrong card for this mission (for example a symptom stated as a cause or an unrelated issue). */
  trap: string;
  /**
   * Direct cause(s) that the extra indirect cause explains: "x-direct" is the extra direct cause above,
   * "n1" the mission's own direct cause. Two values when the indirect cause reasonably explains both.
   */
  indirectOf: ("x-direct" | "n1")[];
}
export const missionTreeCards: Record<string, MissionTreeCards> = {
  agua: {
    direct: "Fuentes de abastecimiento con caudal variable",
    indirect: "Protección insuficiente de las cuencas abastecedoras",
    effect: "Mayor gasto de los hogares en agua comprada a carrotanques",
    trap: "Alto consumo de agua embotellada en las zonas urbanas",
    indirectOf: ["x-direct"],
  },
  movilidad: {
    direct: "Rutas y horarios poco coordinados entre operadores",
    indirect: "Planeación del transporte desarticulada del uso del suelo",
    effect: "Mayor accidentalidad en los corredores congestionados",
    trap: "Gran cantidad de vehículos nuevos vendidos en la ciudad",
    indirectOf: ["x-direct", "n1"],
  },
  residuos: {
    direct: "Rutas de recolección con baja frecuencia en barrios periféricos",
    indirect: "Débil educación ciudadana sobre manejo de residuos",
    effect: "Proliferación de botaderos a cielo abierto",
    trap: "Aumento del precio internacional del plástico reciclado",
    indirectOf: ["n1"],
  },
  salud: {
    direct: "Distancias largas y transporte escaso hacia los centros de salud",
    indirect: "Alta rotación del personal de salud rural",
    effect: "Saturación de las urgencias del hospital municipal",
    trap: "Alta demanda de cirugías estéticas en la ciudad",
    indirectOf: ["n1"],
  },
  planta: {
    direct: "Paradas no programadas por mantenimiento correctivo",
    indirect: "Escasa inversión en modernización tecnológica",
    effect: "Mayor costo unitario de producción",
    trap: "Competidores con campañas publicitarias más visibles",
    indirectOf: ["x-direct"],
  },
  mercado: {
    direct: "Costos de cambio de proveedor elevados para los usuarios",
    indirect: "Normas que favorecen a los operadores establecidos",
    effect: "Baja calidad del servicio sin presión competitiva",
    trap: "Usuarios que prefieren siempre la marca más conocida",
    indirectOf: ["n1"],
  },
  energia: {
    direct: "Redes de distribución deterioradas",
    indirect: "Planificación energética sin datos de demanda",
    effect: "Daños en equipos y alimentos de los hogares",
    trap: "Uso nocturno de pantallas y electrodomésticos",
    indirectOf: ["n1", "x-direct"],
  },
  alimentos: {
    direct: "Vías rurales que encarecen el transporte de las cosechas",
    indirect: "Poco acceso de los productores a asistencia técnica",
    effect: "Desperdicio de alimentos antes de llegar al mercado",
    trap: "Preferencia de los consumidores por alimentos importados",
    indirectOf: ["n1"],
  },
  vivienda: {
    direct: "Asentamientos en zonas de riesgo no mitigable",
    indirect: "Débil control urbano sobre la ocupación del suelo",
    effect: "Enfermedades respiratorias por humedad y hacinamiento",
    trap: "Alto precio de los muebles y electrodomésticos",
    indirectOf: ["x-direct"],
  },
};
