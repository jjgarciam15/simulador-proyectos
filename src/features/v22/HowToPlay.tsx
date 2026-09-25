import { useState } from "react";
import { Search, PenTool, Scale, Wallet, Gem, LineChart, Gavel } from "lucide-react";

const steps = [
  { Icon: Search, title: "1. Analiza", stage: "Diagnóstico", text: "Construye el Árbol del problema, identifica actores y población y compra información si puede cambiar tu decisión." },
  { Icon: PenTool, title: "2. Formula", stage: "Formulación", text: "Transforma el problema en objetivo general y objetivos específicos." },
  { Icon: Scale, title: "3. Compara", stage: "Formulación", text: "Elige entre alternativas con trade-offs reales: inversión, O&M, cobertura, riesgo y ambiente." },
  { Icon: Wallet, title: "4. Presupuesta", stage: "Preparación", text: "Arma la cadena de valor, el presupuesto sin valores precargados y clasifica efectos e impactos." },
  { Icon: Gem, title: "5. Valora", stage: "Evaluación", text: "Mide los impactos y elige métodos de valoración; construye el flujo financiero y el económico con RPC." },
  { Icon: LineChart, title: "6. Evalúa", stage: "Evaluación y Regulación", text: "Calcula el VPN, prueba escenarios y estrés, analiza la regulación y sustenta los ODS." },
  { Icon: Gavel, title: "7. Decide", stage: "Decisión", text: "Compara alternativas, defiende tu proyecto ante el comité, invierte y enfrenta la ejecución." },
];
export function HowToPlay() {
  return (
    <section className="v22-howto" aria-label="Cómo jugar">
      {steps.map(({ Icon, title, stage, text }) => (
        <article key={title}>
          <Icon size={22} aria-hidden />
          <h3>{title}</h3>
          <small>{stage}</small>
          <p>{text}</p>
        </article>
      ))}
    </section>
  );
}
export const tutorial = [
  { q: "¿Cuál describe un problema y no una solución?", o: [["Baja continuidad del servicio de agua", 1], ["Falta de una planta nueva", 0], ["Construir un tanque", 0], ["Comprar carrotanques para las veredas", 0], ["Pérdida de productividad de los hogares", 0]], why: "Un problema es una situación negativa; «falta de X» suele esconder una solución y la pérdida de productividad es un efecto." },
  { q: "«Hogares con agua continua» es un…", o: [["Resultado", 1], ["Producto", 0], ["Insumo", 0], ["Impacto valorado en pesos", 0], ["Costo de operación", 0]], why: "Es un cambio en la población: el producto sería la planta en operación." },
  { q: "Ahorrar 45 horas al año por persona es…", o: [["Una medición: falta valorarla", 1], ["Un valor en pesos", 0], ["Un costo hundido", 0], ["Un ingreso del flujo financiero", 0], ["Una transferencia", 0]], why: "Medir no es valorar: falta un método, como el valor del tiempo." },
  { q: "Un subsidio en el flujo económico…", o: [["Se excluye: es una transferencia", 1], ["Se suma como beneficio", 0], ["Se multiplica por 1,032", 0], ["Se resta como costo", 0], ["Se ajusta con la RPC de mano de obra", 0]], why: "Cambia quién paga, no los recursos de la sociedad." },
] as const;
const order = (i: number) => [...tutorial[i].o.keys()].sort((a, b) => ((a * 7 + i * 3) % 5) - ((b * 7 + i * 3) % 5));
/** Short interactive tutorial: four small decisions instead of a long explanation. */
export function Tutorial() {
  const [i, setI] = useState(0),
    [pick, setPick] = useState<number | null>(null),
    [score, setScore] = useState(0);
  if (i >= tutorial.length)
    return (
      <div className="v22-experiment" role="status">
        <h4>Tutorial completado: {score}/{tutorial.length}</h4>
        <p>Ya practicaste las cuatro ideas centrales: problema, cadena de valor, medir vs valorar y transferencias.</p>
        <button className="text-btn" onClick={() => { setI(0); setScore(0); setPick(null); }}>Repetir</button>
      </div>
    );
  const t = tutorial[i];
  return (
    <div className="v22-experiment">
      <h4>Tutorial · decisión {i + 1} de {tutorial.length}</h4>
      <p>{t.q}</p>
      <div className="v22-choice">
        {order(i).map((k) => {
          const [text, ok] = t.o[k];
          return (
            <label key={text} className={pick === k ? "chosen" : ""}>
              <input type="radio" name={"tut" + i} checked={pick === k} disabled={pick !== null} onChange={() => { setPick(k); if (ok) setScore(score + 1); }} />
              {text}
            </label>
          );
        })}
      </div>
      {pick !== null && (
        <>
          <p className={"v22-status " + (t.o[pick][1] ? "ok" : "grave")}>
            <span className="v22-status-label">{t.o[pick][1] ? "Correcto:" : "Revisa:"}</span> {t.why}
          </p>
          <button className="text-btn" onClick={() => { setI(i + 1); setPick(null); }}>Siguiente</button>
        </>
      )}
    </div>
  );
}
