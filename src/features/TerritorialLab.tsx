import { useState } from "react";
import { ArrowDown, ArrowUp, Landmark, MapPinned, X } from "lucide-react";
import type { GameState } from "../domain/types";
import { selected, type Action } from "../domain/engine";
import { scenarioById } from "../data/scenarios";
import { lawSections, ley388, motiveName } from "../data/ley388";
import {
  amountOk,
  currentTerritory,
  destinationQuestion,
  encajeQuestions,
  encajeScore,
  generatorQuestion,
  legalQuestion,
  plusvaliaCase,
  plusvaliaScore,
  prediosScore,
  projectTerritory,
  routeSteps,
  territorialConsequences,
  territoryScore,
  type Question,
  type TerritoryAnswers,
} from "../domain/territory";
import { helpPolicy } from "../domain/help";
import { useDraftGuard, different } from "../components/workbench";
import { Button, Panel, Tip } from "../components/ui";
import { ConceptLinks, Deferred, Status } from "./v22/common";
import { fb, FeedbackLegend, type FeedbackLevel } from "../components/feedback";

const nf = (n: number) => n.toLocaleString("es-CO");

/** One multiple choice question (5 options). After confirming, the chosen option shows its feedback on hover. */
function Ask({ q, value, onChange, mark }: { q: Question; value: string; onChange: (v: string) => void; mark: boolean }) {
  return (
    <fieldset className="v22-choice">
      <legend>{q.prompt}</legend>
      {q.options.map((o) => (
        <label
          key={o.id}
          className={value === o.id ? "chosen" : ""}
          {...(mark && value === o.id ? fb(o.id === q.answer ? "ok" : "grave", o.id === q.answer ? `Correcto. ${q.why}` : `No corresponde. ${q.why}`) : {})}
        >
          <input type="radio" name={q.id} checked={value === o.id} onChange={() => onChange(o.id)} />
          {o.text}
        </label>
      ))}
    </fieldset>
  );
}
function ScoreLine({ score, label }: { score: number; label: string }) {
  return (
    <ul className="findings">
      <Status level={score >= 80 ? "ok" : score >= 50 ? "alerta" : "grave"}>
        {label}: {score}/100.
      </Status>
    </ul>
  );
}

/**
 * Regulación · Ordenamiento territorial con la Ley 388 de 1997. A review of the law applied to the project and
 * three puzzles: where the alternative can be built, how its land is acquired and who keeps the plusvalía.
 */
export default function TerritorialLab({ g, send }: { g: GameState; send: (a: Action) => void }) {
  const s = scenarioById(g.scenarioId),
    alt = selected(g),
    t = projectTerritory(g),
    saved = currentTerritory(g),
    help = helpPolicy(g),
    marks = help.immediate && help.detail !== "score";
  const qs = encajeQuestions(g),
    [encaje, setEncaje] = useState<Record<string, string>>(saved?.encaje ?? {}),
    route = routeSteps(g),
    legal = legalQuestion(g),
    [path, setPath] = useState<string[]>(saved?.predios?.route ?? []),
    [legalAnswer, setLegal] = useState(saved?.predios?.legal ?? ""),
    gq = generatorQuestion(g),
    dq = destinationQuestion(g),
    pv = plusvaliaCase(g),
    [generator, setGenerator] = useState(saved?.plusvalia?.generator ?? ""),
    [amount, setAmount] = useState(saved?.plusvalia?.amount != null ? String(saved.plusvalia.amount) : ""),
    [destination, setDestination] = useState(saved?.plusvalia?.destination ?? "");
  useDraftGuard(
    different(encaje, saved?.encaje ?? {}) ||
      different(path, saved?.predios?.route ?? []) ||
      legalAnswer !== (saved?.predios?.legal ?? "") ||
      generator !== (saved?.plusvalia?.generator ?? ""),
  );
  const label = (id: string) => route.cards.find((c) => c.id === id)?.text ?? id,
    stale = !!g.v2?.territory && !saved,
    consequences = territorialConsequences(g);
  const routeMark = (id: string, i: number): { level: FeedbackLevel; text: string } | null => {
    if (!marks || !saved?.predios || different(path, saved.predios.route)) return null;
    return route.correct[i] === id
      ? { level: "ok", text: `Paso ${i + 1} en su lugar.` }
      : route.correct.includes(id)
        ? { level: "alerta", text: `Este paso va en la posición ${route.correct.indexOf(id) + 1} de la ruta.` }
        : { level: "grave", text: "Este paso no hace parte de una ruta legal de adquisición." };
  };
  const routeLevels = path.map((id, i) => routeMark(id, i)?.level).filter((x): x is FeedbackLevel => !!x);
  return (
    <>
      <Panel title="La Ley 388 de 1997 en tu proyecto" kicker="01 / ORDENAMIENTO TERRITORIAL">
        <ConceptLinks ids={["ordenamiento", "gestion-predial", "plusvalia"]} />
        <p>
          Regular un proyecto también es decidir sobre el suelo. La Ley 388 de 1997 define dónde se puede construir, cómo adquiere el Estado los predios que
          necesita y cómo se reparte el mayor valor que generan sus decisiones. En esta etapa resuelves tres puzzles con la alternativa que elegiste: cambian
          tu caja, tu plazo y tus riesgos, y valen el 40 % de la dimensión «Regulación, territorio y ODS».
        </p>
        <div className="territory-card">
          <MapPinned size={20} aria-hidden />
          <dl>
            <dt>Municipio</dt>
            <dd>
              {s.territory} · {nf(s.population)} habitantes
            </dd>
            <dt>Alternativa</dt>
            <dd>{alt?.name ?? "Sin alternativa"}</dd>
            <dt>Sitio</dt>
            <dd>{t.site.site}</dd>
            <dt>Predios por adquirir</dt>
            <dd>{t.site.plots ? `${t.site.plots} predio(s)` : "Ninguno: usa suelo público o instalaciones existentes"}</dd>
            <dt>Promotor</dt>
            <dd>
              {t.motive ? (
                <>
                  <Landmark size={13} aria-hidden /> Entidad pública · motivo invocable: {motiveName[t.motive]}
                </>
              ) : (
                "Empresa privada"
              )}
            </dd>
            <dt>Contexto territorial</dt>
            <dd>{t.context}</dd>
          </dl>
        </div>
        {stale && <p className="notice">Cambiaste de alternativa: el análisis territorial anterior ya no aplica. Resuelve de nuevo los tres puzzles.</p>}
        {help.immediate && saved && (
          <div className="review-notice">
            <h4>Ordenamiento territorial: {territoryScore(g)}/100</h4>
            <p>Si inviertes con este análisis:</p>
            <ul>
              {consequences.map((c) => (
                <li key={c.title}>
                  <strong>{c.title}.</strong> {c.detail}
                </li>
              ))}
            </ul>
          </div>
        )}
        <h4>Repasa la ley</h4>
        <p className="muted">{ley388.reference}</p>
        {lawSections.map((x) => (
          <details key={x.id} className="law-section">
            <summary>
              <strong>{x.title}</strong> <span className="badge">{x.articles}</span>
            </summary>
            <ul>
              {x.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="muted">
              <strong>En el juego:</strong> {x.inGame}
            </p>
          </details>
        ))}
        <p className="muted">
          {ley388.note}{" "}
          <a href={ley388.source} target="_blank" rel="noreferrer">
            Consultar el texto compilado ↗
          </a>
        </p>
      </Panel>

      <Panel title="Encaje en el ordenamiento" kicker="02 / PUZZLE TERRITORIAL 1 DE 3">
        <p className="muted">
          Antes de invertir, comprueba que la alternativa cabe en el plan de ordenamiento. Si el sitio está en suelo de expansión necesitas plan parcial; si está en
          suelo de protección, debes relocalizar. Omitirlo retrasa la licencia cuando inviertes.
        </p>
        {qs.map((q) => (
          <Ask key={q.id} q={q} value={encaje[q.id] ?? ""} onChange={(v) => setEncaje({ ...encaje, [q.id]: v })} mark={marks && !!saved?.encaje && saved.encaje[q.id as keyof typeof saved.encaje] === encaje[q.id]} />
        ))}
        <Button disabled={qs.some((q) => !encaje[q.id])} onClick={() => send({ type: "territory", puzzle: "encaje", answers: encaje as NonNullable<TerritoryAnswers["encaje"]> })}>
          Confirmar encaje territorial
        </Button>
        {saved?.encaje && (help.immediate ? <ScoreLine score={encajeScore(g, saved.encaje)} label="Encaje en el ordenamiento" /> : <Deferred />)}
      </Panel>

      <Panel title="Ruta de adquisición de predios" kicker="03 / PUZZLE TERRITORIAL 2 DE 3">
        <p className="muted">
          {t.site.plots
            ? `Tu alternativa necesita ${t.site.plots} predio(s). Arma la ruta en orden: toca un paso para agregarlo y usa las flechas para moverlo. Algunos pasos no son legales.`
            : "Tu alternativa no necesita predios, pero la entidad debe dominar la ruta: arma los pasos en orden. Algunos pasos no son legales."}
        </p>
        <div className="route-builder">
          <div>
            <strong>Pasos disponibles</strong>
            <div className="route-bank">
              {route.cards
                .filter((c) => !path.includes(c.id))
                .map((c) => (
                  <button key={c.id} type="button" className="chip" onClick={() => setPath([...path, c.id])}>
                    {c.text}
                  </button>
                ))}
            </div>
          </div>
          <div>
            <strong>Tu ruta</strong>
            {routeLevels.length > 0 && <FeedbackLegend counts={{ ok: routeLevels.filter((x) => x === "ok").length, alerta: routeLevels.filter((x) => x === "alerta").length, grave: routeLevels.filter((x) => x === "grave").length }} />}
            <ol className="route-list">
              {path.map((id, i) => {
                const m = routeMark(id, i);
                return (
                  <li key={id} tabIndex={m ? 0 : undefined} {...fb(m?.level, m?.text ?? "")}>
                    <span>{label(id)}</span>
                    <span className="route-tools">
                      <button type="button" className="icon-btn" aria-label={`Subir «${label(id)}»`} disabled={i === 0} onClick={() => setPath(path.map((x, j) => (j === i - 1 ? id : j === i ? path[i - 1] : x)))}>
                        <ArrowUp size={14} />
                      </button>
                      <button type="button" className="icon-btn" aria-label={`Bajar «${label(id)}»`} disabled={i === path.length - 1} onClick={() => setPath(path.map((x, j) => (j === i + 1 ? id : j === i ? path[i + 1] : x)))}>
                        <ArrowDown size={14} />
                      </button>
                      <button type="button" className="icon-btn" aria-label={`Quitar «${label(id)}»`} onClick={() => setPath(path.filter((x) => x !== id))}>
                        <X size={14} />
                      </button>
                    </span>
                  </li>
                );
              })}
              {!path.length && <li className="muted">Toca los pasos en el orden en que deben ocurrir.</li>}
            </ol>
          </div>
        </div>
        <Ask q={legal} value={legalAnswer} onChange={setLegal} mark={marks && saved?.predios?.legal === legalAnswer} />
        <Button disabled={path.length < 3 || !legalAnswer} onClick={() => send({ type: "territory", puzzle: "predios", answers: { route: path, legal: legalAnswer } })}>
          Confirmar ruta predial
        </Button>
        {saved?.predios && (help.immediate ? <ScoreLine score={prediosScore(g, saved.predios)} label="Ruta de adquisición de predios" /> : <Deferred />)}
      </Panel>

      <Panel title="Participación en la plusvalía" kicker="04 / PUZZLE TERRITORIAL 3 DE 3">
        <p className="muted">
          Cuando una decisión urbanística o una obra pública valoriza el suelo, el municipio participa de ese mayor valor. En un proyecto público bien liquidado,
          la plusvalía cofinancia la obra; en uno privado, es un costo que la empresa debe prever.
        </p>
        <Ask q={gq} value={generator} onChange={setGenerator} mark={marks && saved?.plusvalia?.generator === generator} />
        {generator && generator !== "ninguno" && (
          <>
            <div className="table-wrap">
              <table>
                <caption>Caso de liquidación (datos simulados de esta partida)</caption>
                <tbody>
                  <tr>
                    <th>Área que recibe el mayor valor</th>
                    <td>{nf(pv.area)} m²</td>
                  </tr>
                  <tr>
                    <th>Precio de referencia antes de la acción</th>
                    <td>{nf(pv.before)} COP/m²</td>
                  </tr>
                  <tr>
                    <th>Precio de referencia después</th>
                    <td>{nf(pv.after)} COP/m²</td>
                  </tr>
                  <tr>
                    <th>Tasa fijada por el Concejo (art. 79)</th>
                    <td>{pv.rate} %</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <label
              className="field"
              {...(marks && saved?.plusvalia && String(saved.plusvalia.amount) === amount && saved.plusvalia.generator === generator
                ? amountOk(g, Number(amount))
                  ? fb("ok", "Liquidación correcta: mayor valor por m² × área × tasa.")
                  : fb("grave", "Revisa la liquidación: (precio después − precio antes) × área × tasa, en millones de pesos.")
                : {})}
            >
              <span>Participación en la plusvalía (millones de COP)</span>
              <input type="number" min={0} step="0.1" value={amount} onChange={(e) => setAmount(e.target.value)} />
              {help.guidedHints && <small>Mayor valor por m² × área × tasa. Divide entre 1.000.000 para expresarlo en millones.</small>}
            </label>
            <Ask q={dq} value={destination} onChange={setDestination} mark={marks && saved?.plusvalia?.destination === destination} />
          </>
        )}
        <Button
          disabled={!generator || (generator !== "ninguno" && (amount === "" || !destination))}
          onClick={() =>
            send({ type: "territory", puzzle: "plusvalia", answers: { generator, amount: generator === "ninguno" ? null : Number(amount), destination: generator === "ninguno" ? "" : destination } })
          }
        >
          Confirmar plusvalía
        </Button>
        {saved?.plusvalia && (help.immediate ? <ScoreLine score={plusvaliaScore(g, saved.plusvalia)} label="Participación en la plusvalía" /> : <Deferred />)}
        <Tip title="Datos simulados">
          Aurora es un territorio ficticio: los sitios, predios y precios son simulados para aprender la mecánica de la Ley 388 de 1997. Las reglas (clases de suelo,
          ruta de adquisición, tasa del 30 % al 50 %, exigibilidad y destino) son las de la ley.
        </Tip>
      </Panel>
    </>
  );
}
