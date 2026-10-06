import { ArrowLeft, ArrowRight, Presentation, X } from "lucide-react";

/**
 * Modo presentación: guide shown above a solved example game. For each stage it says what to show
 * (the functions of the simulator), and lets the presenter move between stages. Read-only.
 */
const stages: { title: string; show: string }[] = [
  { title: "Diagnóstico", show: "Estudios comprados en el Centro de información, Árbol del problema construido con tarjetas y trampas, enlaces causales del laboratorio MGA, mapa de poder e interés, negociación con actores y focalización de la población." },
  { title: "Formulación", show: "Árbol de objetivos (general y específicos), alternativa elegida frente a las otras con el comparador, y cómo cada alternativa atiende las causas del problema." },
  { title: "Preparación", show: "Cadena de valor armada por niveles, presupuesto con datos básicos y partidas detalladas, cronograma, indicadores de producto y resultado, y clasificación de efectos e impactos." },
  { title: "Evaluación", show: "Valoración económica de impactos con su método, flujo financiero, flujo económico con RPC del DNP, sensibilidad con análisis de riesgo Monte Carlo, distribución y evaluación ex ante." },
  { title: "Regulación", show: "Laboratorio regulatorio: severidad de la falla, instrumento proporcional, cadena causal completa y ODS justificados con su tipo de relación y evidencia." },
  { title: "Decisión", show: "Riesgos mitigados, comité evaluador con preguntas derivadas de la partida, comparación final y compromiso de la inversión." },
  { title: "Ejecución", show: "Eventos condicionales atendidos durante la obra, dilemas con consecuencias diferidas y la bitácora de decisiones." },
  { title: "Ex post", show: "Nota final con el desglose completo por actividad, aciertos y errores, historia del proyecto, comparación con lo esperado y recomendaciones." },
];
export default function PresentationBar({ phase, onPhase, onExit }: { phase: number; onPhase: (i: number) => void; onExit: () => void }) {
  const st = stages[phase] ?? stages[0];
  return (
    <section className="presentation-bar" aria-label="Modo presentación">
      <div className="presentation-head">
        <span className="presentation-tag">
          <Presentation size={15} aria-hidden /> MODO PRESENTACIÓN · partida de ejemplo resuelta · solo lectura
        </span>
        <button type="button" className="text-btn" onClick={onExit}>
          <X size={15} aria-hidden /> Salir de la presentación
        </button>
      </div>
      <p>
        <strong>Etapa {phase + 1} de 8 · {st.title}.</strong> Qué mostrar: {st.show}
      </p>
      <div className="presentation-nav">
        <button type="button" className="btn secondary" disabled={phase === 0} onClick={() => onPhase(phase - 1)}>
          <ArrowLeft size={15} aria-hidden /> Etapa anterior
        </button>
        <div className="presentation-steps" role="tablist" aria-label="Etapas de la presentación">
          {stages.map((s, i) => (
            <button key={s.title} type="button" role="tab" aria-selected={i === phase} className={i === phase ? "active" : ""} onClick={() => onPhase(i)} title={s.title}>
              {i + 1}
            </button>
          ))}
        </div>
        <button type="button" className="btn" disabled={phase === 7} onClick={() => onPhase(phase + 1)}>
          Etapa siguiente <ArrowRight size={15} aria-hidden />
        </button>
      </div>
    </section>
  );
}
