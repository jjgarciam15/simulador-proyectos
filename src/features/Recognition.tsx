import { useState } from "react";
import {
  Award,
  Trophy,
  Download,
  FileText,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";
import type { GameState } from "../domain/types";
import {
  projectMedals,
  projectReport,
  reportIndicators,
  performanceLabel,
  campaignSummary,
  type CampaignVault,
} from "../domain/recognition";
import { Panel, Button } from "../components/ui";
import { scenarioById, scenarios } from "../data/scenarios";
import { missions } from "../data/world";
import { money } from "../domain/finance";

const medalCatalog = [
  [
    "causal",
    "Cartógrafo del problema",
    "Cuatro enlaces causales correctos y objetivo general coherente.",
  ],
  [
    "chain",
    "Arquitecto de soluciones",
    "Cadena de valor estructuralmente consistente y actividades financiadas.",
  ],
  [
    "measurement",
    "Guardián de la evidencia",
    "Indicadores de producto y resultado sin observaciones estructurales.",
  ],
  ["risk", "Decisor preparado", "Tres estudios y una mitigación confirmada."],
  [
    "service",
    "Reconstructor del distrito",
    "Ejecución dentro del plazo, cobertura ≥ 60 % y VPN social positivo.",
  ],
  ["planner", "Planificador", "Sin crédito, presupuesto diagnosticado ≥ 80 y sobrecostos cubiertos por la contingencia."],
  ["analyst", "Analista", "Cadena de valor ≥ 80/100 al invertir."],
  ["regulator", "Regulador", "Cadena regulatoria ≥ 75 e instrumento proporcional a la severidad real."],
  ["riskmanager", "Gestor de riesgo", "Superar un evento y cerrar a tiempo con cobertura ≥ 50 %."],
  ["sustainable", "Proyecto sostenible", "ODS pertinentes y sustentados (≥ 75) sin selección indiscriminada."],
];
export function FinalRecognition({ g }: { g: GameState }) {
  const [downloadError, setDownloadError] = useState(""),
    o = g.outcome!,
    medals = projectMedals(g);
  function download() {
    try {
      const url = URL.createObjectURL(
        new Blob([projectReport(g)], { type: "text/html;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `PROYECTA-informe-${g.scenarioId}-${g.id.slice(0, 8)}.html`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setDownloadError("");
    } catch {
      setDownloadError(
        "No se pudo descargar. El informe sigue disponible en esta pantalla.",
      );
    }
  }
  return (
    <>
      <Panel
        className="recognition-panel"
        title="Tu premio: evidencias para seguir construyendo"
        kicker="RECONOCIMIENTOS DEL CONSEJO"
      >
        <div className="award-intro">
          <div className="award-emblem">
            <Award size={50} />
          </div>
          <div>
            <h3>
              {medals.length
                ? "Colección de logros de esta misión"
                : "Bitácora de experiencia"}
            </h3>
            <p>
              {medals.length
                ? `Obtuviste ${medals.length} de ${medalCatalog.length} insignias por decisiones verificables.`
                : "Cerraste una estrategia y conservas su historia para aprender. Aún faltan evidencias para las insignias de formulación."}
            </p>
          </div>
        </div>
        <div className="medal-grid">
          {medalCatalog.map(([id, title, requirement]) => {
            const medal = medals.find((m) => m.id === id);
            return (
              <article
                key={id}
                className={medal ? "medal-earned" : "medal-locked"}
              >
                {medal ? <Award size={27} /> : <LockKeyhole size={22} />}
                <span>{medal ? "OBTENIDA" : "POR DESARROLLAR"}</span>
                <h4>{title}</h4>
                <p>{medal?.evidence ?? requirement}</p>
              </article>
            );
          })}
        </div>
        <p className="recognition-note">
          Las insignias reconocen evidencias de la partida; no certifican
          dominio de la MGA. No añaden dinero ni alteran la puntuación. Una
          ejecución adversa puede conservar buenos logros de formulación.
        </p>
      </Panel>
      <Panel
        title="Informe final de tu proyecto"
        kicker="RESULTADOS · INTERPRETACIÓN · APRENDIZAJE"
      >
        <div className="report-heading">
          <FileText size={30} />
          <div>
            <h3>{scenarioById(g.scenarioId).title}</h3>
            <p>
              <strong>
                {o.score}/100 · {performanceLabel(o.score)}
              </strong>
            </p>
          </div>
          <Button onClick={download}>
            <Download size={17} />
            Descargar informe
          </Button>
        </div>
        <p>
          El indicador resume la estrategia y el desempeño observado con los
          pesos de tu rol. No depende solo de rentabilidad: considera
          coherencia, cobertura, riesgo, sostenibilidad, disciplina, plazo y
          legitimidad.
        </p>
        <div className="report-summary">
          <div>
            <span>Personas atendidas estimadas</span>
            <strong>
              {Math.round(
                o.coverage * scenarioById(g.scenarioId).affected,
              ).toLocaleString("es-CO")}
            </strong>
          </div>
          <div>
            <span>Cobertura observada</span>
            <strong>{(o.coverage * 100).toFixed(1)} %</strong>
          </div>
          <div>
            <span>Gasto ejecutado</span>
            <strong>$ {money(g.spent)}</strong>
          </div>
          <div>
            <span>VPN social observado</span>
            <strong>$ {money(o.social)}</strong>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Indicador</th>
                <th>Meta declarada</th>
                <th>Observado simulado</th>
              </tr>
            </thead>
            <tbody>
              {reportIndicators(g).map((i, index) => (
                <tr key={index}>
                  <td>{i.name}</td>
                  <td>
                    {i.target} {i.unit}
                  </td>
                  <td>
                    {i.observed.toLocaleString("es-CO", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    {i.observedUnit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details className="report-scale">
          <summary>Interpretar mi valoración de 0 a 100</summary>
          <p>
            85–100: destacado · 70–84: sólido · 50–69: en desarrollo · 0–49:
            necesita revisión.
          </p>
          <p>
            Se ponderan las dimensiones guardadas al cierre. Abandono e
            insolvencia aplican un factor de 0,35. Los umbrales son educativos,
            no una certificación oficial.
          </p>
        </details>
        <p className="recognition-note">
          El archivo HTML incluye resultados, dimensiones, premios,
          justificación y diario. Se abre sin conexión y puedes imprimirlo o
          guardarlo como PDF desde el navegador. Para incluir tu reflexión,
          guárdala en el laboratorio MGA y descarga de nuevo.
        </p>
        {downloadError && <p role="alert">{downloadError}</p>}
      </Panel>
    </>
  );
}

export function CampaignRecognition({
  history,
  vault,
}: {
  history: GameState[];
  vault?: CampaignVault;
}) {
  const c = campaignSummary(history, vault);
  return (
    <section
      className={
        "campaign-recognition " + (c.finished ? "campaign-complete" : "")
      }
      aria-label="Reconocimiento de campaña"
    >
      <div className="campaign-heading">
        <Trophy size={40} />
        <div>
          <span className="eyebrow">EL LEGADO DEL CONSEJO</span>
          <h2>
            {c.finished
              ? "Consejero de la reconstrucción de Aurora"
              : "Tu camino al reconocimiento de Aurora"}
          </h2>
          <p>
            {c.finished
              ? `Completaste los ${c.total} proyectos. Valoración de campaña: ${c.score}/100 · ${performanceLabel(c.score!)}.`
              : `${c.completed} de ${c.total} proyectos con ejecución finalizada. Completa todos para obtener el premio de campaña.`}
          </p>
        </div>
      </div>
      <progress value={c.completed} max={c.total} />
      <details>
        <summary>Ver proyectos y reglas del premio</summary>
        <p>
          Se toma la mejor puntuación de cada proyecto con ejecución finalizada,
          incluso si cerró fuera de plazo. Abandono e insolvencia conservan
          aprendizajes, pero no completan el distrito. Repetir un proyecto no
          cuenta como un distrito adicional.
        </p>
        <div className="campaign-projects">
          {scenarios.map((s) => (
            <div key={s.id}>
              {c.records[s.id] ? (
                <CheckCircle2 size={17} />
              ) : (
                <LockKeyhole size={17} />
              )}
              <span>{missions[s.id].district}</span>
              <strong>
                {c.records[s.id] ? c.records[s.id].score + "/100" : "Pendiente"}
              </strong>
            </div>
          ))}
        </div>
        <p>
          Valoración final = promedio simple de las mejores puntuaciones de los{" "}
          {c.total} proyectos. Es un resumen de tus mejores ejecuciones, no de
          todas tus tentativas. Los mejores registros se conservan aunque se
          roten informes antiguos del historial.
        </p>
      </details>
      {c.finished && (
        <p className="campaign-award">
          Premio obtenido: insignia «Consejero de la reconstrucción». Reconoce
          la aplicación de la formulación en nueve contextos simulados; puedes
          seguir explorando otras estrategias.
        </p>
      )}
    </section>
  );
}
