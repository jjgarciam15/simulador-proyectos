import {CampaignRecognition} from './Recognition';
import type {CampaignVault} from '../domain/recognition';
import { TerritoryMap } from "../components/LivingWorld";
import {
  Zap,
  Sprout,
  House,
  ArrowUpRight,
  ArrowRight,
  Droplets,
  Route,
  Recycle,
  HeartPulse,
  Factory,
  Scale,
  Play,
  Flag,
  Compass,
  Radio,
  MapPin,
} from "lucide-react";
import type { GameState } from "../domain/types";
import { scenarios } from "../data/scenarios";
import { assets, missions, nationProgress, world } from "../data/world";
import { money } from "../domain/finance";
import { Button } from "../components/ui";
const icons = [
  Droplets,
  Route,
  Recycle,
  HeartPulse,
  Factory,
  Scale,
  Zap,
  Sprout,
  House,
];
export default function NationHome({
  history,
  vault,
  active,
  onChoose,
  onContinue,
  onLearn,
  role,
  setRole,
}: {
  history: GameState[];
  vault?:CampaignVault;
  active: GameState | null;
  onChoose: (id: string) => void;
  onContinue: () => void;
  onLearn: () => void;
  role: string;
  setRole: (r: string) => void;
}) {
  const nation = nationProgress(history);
  return (
    <main className="nation-home">
      <section className="nation-hero">
        <img
          className="nation-art"
          src={assets.nation}
          alt="Ilustración 3D de Aurora: una ciudad reconstruye sus redes de agua, puentes, hospitales y zonas productivas entre las ruinas"
        />
        <div className="nation-veil" />
        <div className="nation-story">
          <div className="eyebrow">
            <Radio size={13} /> {world.era.toUpperCase()}
          </div>
          <h1>
            Una nación en ruinas.
            <br />
            <em>Un futuro por decidir.</em>
          </h1>
          <p>{world.intro}</p>
          <div className="actions">
            <Button onClick={() => onChoose("agua")}>
              Comenzar reconstrucción <ArrowRight size={17} />
            </Button>
            {active && !active.outcome && (
              <Button secondary onClick={onContinue}>
                <Play size={16} />
                Continuar misión
              </Button>
            )}
          </div>
          <button className="text-btn" onClick={onLearn}>
            Primera expedición · cómo jugar <ArrowUpRight size={14} />
          </button>
        </div>
        <span className="world-coordinate">
          <MapPin size={13} /> AURORA · TERRITORIO DE RECONSTRUCCIÓN
        </span>
        <div className="hero-status">
          <span>ESTADO DE LA NACIÓN</span>
          <strong>
            {nation.progress}
            <small>%</small>
          </strong>
          <div className="nation-progress">
            <span style={{ width: nation.progress + "%" }} />
          </div>
          <p>
            {nation.restored} de {scenarios.length} servicios con cobertura ≥ 50
            %
          </p>
        </div>
      </section>
      <div className="nation-ribbon">
        <span>
          <Flag size={17} />
          <strong>Tú diriges la reconstrucción.</strong> Cada proyecto deja una
          huella.
        </span>
        <span>{scenarios.length} misiones abiertas · 8 etapas por misión</span>
      </div>
      <CampaignRecognition history={history} vault={vault}/><TerritoryMap history={history} onChoose={onChoose} />
      <section className="mission-board">
        <div className="board-heading">
          <div>
            <span className="eyebrow">EL CONSEJO TE NECESITA</span>
            <h2>Elige dónde empieza el cambio.</h2>
          </div>
          <span>
            <Compass size={17} />
            60–90 minutos por misión
          </span>
        </div>
        <div className="scenario-filter">
          {[
            ["todos", "Todo el territorio"],
            ["publico", "Reconstrucción pública"],
            ["privado", "Iniciativa privada"],
          ].map(([id, label]) => (
            <button
              className={role === id ? "active" : ""}
              key={id}
              onClick={() => setRole(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mission-grid">
          {scenarios.map((s, i) => {
            const m = missions[s.id],
              Icon = icons[i],
              past = nation.best[s.id];
            return (
              (role === "todos" || role === s.role) && (
                <button
                  key={s.id}
                  className={"mission-card mission-" + i}
                  onClick={() => onChoose(s.id)}
                >
                  <div className="mission-card-top">
                    <span className="mission-number">
                      MISIÓN {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={"mission-status " + (past ? "restored" : "")}
                    >
                      {past
                        ? "EN RECONSTRUCCIÓN"
                        : i === 0
                          ? "COMIENZA AQUÍ"
                          : "DISPONIBLE"}
                    </span>
                  </div>
                  <div className="mission-icon">
                    <Icon size={33} strokeWidth={1.4} />
                  </div>
                  <span className="mission-district">{m.district}</span>
                  <h3>{m.chapter}</h3>
                  <p>{m.hook}</p>
                  <div className="mission-resources">
                    <span>
                      Fondo inicial<strong>$ {money(s.budget)}</strong>
                    </span>
                    <span>
                      Plazo<strong>{s.deadline} meses</strong>
                    </span>
                  </div>
                  <div className="mission-card-bottom">
                    <span>
                      {past
                        ? Math.round(past.outcome!.coverage * 100) +
                          " % de cobertura · probar otra estrategia"
                        : s.regulator
                          ? "Asumir el rol de regulador"
                          : s.role === "privado"
                            ? "Reactivar la producción"
                            : "Recibir misión"}
                    </span>
                    <ArrowRight size={18} />
                  </div>
                </button>
              )
            );
          })}
        </div>
      </section>
      <section className="crew-intro">
        <img src={assets.mara} alt="Mara, ingeniera de reconstrucción" />
        <div>
          <span className="eyebrow">NO RECONSTRUYES A SOLAS</span>
          <h3>
            «No necesitamos la obra más grande.
            <br />
            Necesitamos una que siga funcionando mañana.»
          </h3>
          <p>Mara · ingeniera del Consejo de Aurora</p>
        </div>
        <img src={assets.ivo} alt="Ivo, enlace de las comunidades" />
      </section>
      <p className="fiction-note">
        Aurora y el Gran Apagón son ficción. Los conceptos de formulación,
        evaluación y regulación se mantienen como herramientas académicas. Datos
        simulados en millones de COP.
      </p>
    </main>
  );
}
