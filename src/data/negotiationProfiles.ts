import type { Budget } from "../domain/types";
export interface NegotiationProfile {
  category: keyof Budget;
  name: string;
  fraction: number;
  evidence: string;
}
const p = (
  category: keyof Budget,
  name: string,
  fraction: number,
  evidence: string,
): NegotiationProfile => ({ category, name, fraction, evidence });
// Simulated negotiating demands, not official standards or territorial estimates.
export const negotiationProfiles: Record<string, NegotiationProfile[]> = {
  agua: [
    p(
      "social",
      "formación de juntas y acceso rural",
      0.012,
      "Registro de hogares conectados y formación de operadores comunitarios.",
    ),
    p(
      "maintenance",
      "repuestos y mantenimiento de bombas",
      0.018,
      "Plan anual de mantenimiento y registro de continuidad.",
    ),
    p(
      "environment",
      "protección de fuentes y manejo de lodos",
      0.015,
      "Seguimiento a captación y disposición de residuos del tratamiento.",
    ),
    p(
      "oversight",
      "seguimiento público de continuidad y tarifas",
      0.012,
      "Reporte de interrupciones y atención de reclamaciones.",
    ),
  ],
  movilidad: [
    p(
      "social",
      "accesibilidad de paradas y participación de usuarios",
      0.014,
      "Auditoría de recorridos accesibles y tiempos de viaje.",
    ),
    p(
      "maintenance",
      "conservación de flota e infraestructura",
      0.02,
      "Registro de disponibilidad y mantenimiento anual.",
    ),
    p(
      "environment",
      "control de polvo y ruido durante obras",
      0.012,
      "Monitoreo en comercios y viviendas del corredor.",
    ),
    p(
      "oversight",
      "fiscalización de prioridad vial y seguridad",
      0.013,
      "Registro de cumplimiento de rutas y siniestros.",
    ),
  ],
  residuos: [
    p(
      "social",
      "inclusión y capacitación de recicladores",
      0.016,
      "Registro de organizaciones participantes y condiciones de trabajo.",
    ),
    p(
      "maintenance",
      "disponibilidad de equipos de clasificación",
      0.018,
      "Bitácora de equipos y toneladas efectivamente tratadas.",
    ),
    p(
      "environment",
      "control de lixiviados y molestias vecinales",
      0.022,
      "Registro de tratamiento y reclamaciones ambientales.",
    ),
    p(
      "oversight",
      "trazabilidad y calidad del material recuperado",
      0.01,
      "Actas de calidad y pesaje de materiales vendidos.",
    ),
  ],
  salud: [
    p(
      "social",
      "acompañamiento para acceso rural",
      0.018,
      "Registro de personas atendidas y barreras de acceso.",
    ),
    p(
      "maintenance",
      "disponibilidad de equipos clínicos",
      0.022,
      "Plan de mantenimiento y registro de equipos operativos.",
    ),
    p(
      "environment",
      "gestión de residuos sanitarios",
      0.014,
      "Trazabilidad del manejo de residuos de atención.",
    ),
    p(
      "oversight",
      "seguimiento a referencia y calidad de atención",
      0.016,
      "Verificación de remisiones y continuidad de atención.",
    ),
  ],
  planta: [
    p(
      "oversight",
      "trazabilidad y control de calidad",
      0.014,
      "Ensayos de calidad y cumplimiento de entregas.",
    ),
    p(
      "social",
      "reconversión laboral y formación técnica",
      0.02,
      "Registro de capacitación y transición de puestos.",
    ),
    p(
      "environment",
      "control de vertimientos y consumo de agua",
      0.024,
      "Medición de consumo y tratamiento por unidad producida.",
    ),
    p(
      "maintenance",
      "confiabilidad de la capacidad instalada",
      0.015,
      "Registro anual de disponibilidad; no implica acuerdos de precios con competidores.",
    ),
  ],
  mercado: [
    p(
      "social",
      "información comprensible y atención a usuarios",
      0.015,
      "Registro de reclamaciones y usuarios informados.",
    ),
    p(
      "maintenance",
      "continuidad de infraestructura compartida",
      0.02,
      "Registro anual de disponibilidad y condiciones de acceso.",
    ),
    p(
      "environment",
      "adaptación ambiental de conexiones nuevas",
      0.01,
      "Verificación ambiental de instalaciones de entrada.",
    ),
    p(
      "oversight",
      "auditoría de barreras y acceso no discriminatorio",
      0.025,
      "Publicación de condiciones y resolución de controversias.",
    ),
  ],
  energia: [
    p(
      "social",
      "acceso equitativo y capacitación de usuarios",
      0.014,
      "Registro de conexiones y formación en uso seguro.",
    ),
    p(
      "maintenance",
      "mantenimiento de generación y almacenamiento",
      0.025,
      "Registro anual de autonomía y disponibilidad.",
    ),
    p(
      "environment",
      "gestión de baterías y equipos retirados",
      0.02,
      "Trazabilidad de almacenamiento y disposición de equipos.",
    ),
    p(
      "oversight",
      "supervisión de calidad y continuidad eléctrica",
      0.013,
      "Registro de cortes y calidad del suministro.",
    ),
  ],
  alimentos: [
    p(
      "social",
      "asistencia a productores y acceso a la red",
      0.018,
      "Registro de productores vinculados y asistencia técnica.",
    ),
    p(
      "maintenance",
      "conservación de riego y cadena de frío",
      0.022,
      "Bitácora anual de equipos y pérdidas de cosecha.",
    ),
    p(
      "environment",
      "protección de suelos y gestión del agua",
      0.02,
      "Seguimiento a prácticas de suelo y consumo de agua.",
    ),
    p(
      "oversight",
      "trazabilidad de calidad y comercialización",
      0.014,
      "Registro de entregas, calidad y pérdidas poscosecha.",
    ),
  ],
  vivienda: [
    p(
      "social",
      "acompañamiento de reasentamiento y acceso",
      0.022,
      "Registro de familias atendidas y acuerdos de traslado.",
    ),
    p(
      "maintenance",
      "conservación de espacios comunes",
      0.015,
      "Plan anual de conservación de redes y áreas comunes.",
    ),
    p(
      "environment",
      "manejo de escombros y protección del suelo",
      0.018,
      "Registro de disposición de materiales y condiciones del terreno.",
    ),
    p(
      "oversight",
      "verificación predial y conexión a servicios",
      0.02,
      "Actas de habilitación de predios y servicios efectivos.",
    ),
  ],
};
