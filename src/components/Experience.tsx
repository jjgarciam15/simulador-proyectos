import { useEffect, useRef, useState, type ReactNode } from "react";
import { Volume2, VolumeX, Sparkles, X } from "lucide-react";
import { assets } from "../data/world";
import type { Cue, ExperienceMoment } from "../domain/experience";

const preferenceKey = "aurora-experience-v1";
type Preferences = { sound: boolean; volume: number; cinema: boolean };
function readPreferences(): Preferences {
  try {
    const p = JSON.parse(localStorage.getItem(preferenceKey) || "{}");
    return {
      sound: p.sound === true,
      volume:
        typeof p.volume === "number" && Number.isFinite(p.volume)
          ? Math.max(0, Math.min(1, p.volume))
          : 0.35,
      cinema: p.cinema !== false,
    };
  } catch {
    return { sound: false, volume: 0.35, cinema: true };
  }
}

/** Short, locally synthesized effects; no network, microphone, or audio files. */
class AuroraAudio {
  context: AudioContext | null = null;
  master: GainNode | null = null;
  lastClick = 0;
  async unlock() {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === "suspended") await this.context.resume();
    } catch {
      /* Audio unavailable: the game stays playable. */
    }
  }
  volume(value: number) {
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(value, this.context.currentTime, 0.025);
  }
  play(cue: Cue) {
    const c = this.context,
      m = this.master;
    if (!c || !m || c.state !== "running" || document.hidden) return;
    if (cue === "click" && performance.now() - this.lastClick < 65) return;
    this.lastClick = performance.now();
    const patterns: Record<Cue, number[]> = {
      gain: [440,554,659],
      spend: [350,262],
      strain: [220,196,165],
      funding: [262,392,330,523],
      click: [680],
      confirm: [392, 523],
      chapter: [196, 294, 392, 587],
      event: [330, 247, 330],
      progress: [262, 330, 392],
      finish: [196, 294, 392, 494, 587],
      error: [160, 130],
    };
    patterns[cue].forEach((frequency, index) => {
      const oscillator = c.createOscillator(),
        envelope = c.createGain(),
        start = c.currentTime + index * (cue === "click" ? 0.02 : 0.09),
        duration =
          cue === "click"
            ? 0.045
            : cue === "chapter" || cue === "finish"
              ? 0.48
              : 0.18;
      oscillator.type = cue === "event" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(
        cue === "click" ? 0.07 : 0.11,
        start + 0.012,
      );
      envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(envelope);
      envelope.connect(m);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
    });
  }
  close() {
    void this.context?.close();
    this.context = null;
    this.master = null;
  }
}

export default function Experience({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(readPreferences),
    settings = useRef(preferences),
    audio = useRef<AuroraAudio | null>(null),
    [moment, setMoment] = useState<(ExperienceMoment & { id: number }) | null>(
      null,
    ),
    [systemReduced, setSystemReduced] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const reduced = systemReduced || !preferences.cinema;
  settings.current = preferences;
  useEffect(() => {
    const synth = new AuroraAudio();
    audio.current = synth;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (
        !(target instanceof Element) ||
        !target.closest("button,summary,select,input[type=checkbox]") ||
        target.closest("[disabled]")
      )
        return;
      if (settings.current.sound) {
        void synth.unlock().then(() => {
          synth.volume(settings.current.sound ? settings.current.volume : 0);
          synth.play("click");
        });
      }
    };
    const onMoment = (event: Event) => {
      const value = (event as CustomEvent<ExperienceMoment>).detail;
      if (settings.current.sound) synth.play(value.cue);
      if (["chapter", "event", "progress", "finish"].includes(value.cue))
        setMoment({ ...value, id: performance.now() });
    };
    const visibility = () => {
      if (document.hidden) {
        setMoment(null);
        synth.volume(0);
      } else synth.volume(settings.current.sound ? settings.current.volume : 0);
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("aurora:experience", onMoment);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("aurora:experience", onMoment);
      document.removeEventListener("visibilitychange", visibility);
      synth.close();
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(preferenceKey, JSON.stringify(preferences));
    } catch {}
    audio.current?.volume(preferences.sound ? preferences.volume : 0);
  }, [preferences]);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)"),
      change = () => setSystemReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.auroraMotion = reduced
      ? "reduced"
      : "full";
    return () => {
      delete document.documentElement.dataset.auroraMotion;
    };
  }, [reduced]);
  useEffect(() => {
    if (!moment) return;
    const timer = setTimeout(
      () => setMoment(null),
      reduced ? 1800 : moment.cue === "progress" ? 1350 : 2200,
    );
    const skip = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoment(null);
    };
    window.addEventListener("keydown", skip);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", skip);
    };
  }, [moment, reduced]);
  async function toggleSound() {
    const enabled = !preferences.sound;
    setPreferences({ ...preferences, sound: enabled });
    if (enabled) {
      await audio.current?.unlock();
      audio.current?.volume(preferences.volume);
      audio.current?.play("confirm");
    }
  }
  const epic = moment && !reduced && ["chapter", "finish"].includes(moment.cue);
  return (
    <>
      {children}
      <aside className="experience-controls" aria-label="Sonido y efectos">
        <button
          className="sound-toggle"
          aria-label={
            preferences.sound ? "Silenciar sonidos" : "Activar sonidos"
          }
          aria-pressed={preferences.sound}
          onClick={toggleSound}
        >
          {preferences.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          <span>{preferences.sound ? "Sonido activo" : "Activar sonido"}</span>
        </button>
        <details>
          <summary aria-label="Ajustar efectos">
            <Sparkles size={17} />
          </summary>
          <div className="experience-options">
            <strong>Ambiente de Aurora</strong>
            <button
              className="preview-effects"
              onClick={() => {
                setMoment({
                  id: performance.now(),
                  cue: "chapter",
                  title: "Aurora despierta",
                  detail: "Vista previa de efectos · tu partida no cambia.",
                });
                if (preferences.sound) audio.current?.play("chapter");
              }}
            >
              Probar efectos
            </button>
            <label>
              Volumen
              <input
                aria-label="Volumen de efectos"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={preferences.volume}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    volume: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={preferences.cinema}
                onChange={(e) =>
                  setPreferences({ ...preferences, cinema: e.target.checked })
                }
              />
              Transiciones cinematográficas
            </label>
            {systemReduced && (
              <small>
                Movimiento reducido por la preferencia de tu sistema.
              </small>
            )}
            <small>
              Sonidos breves · sin música continua. Esc omite las transiciones.
            </small>
          </div>
        </details>
      </aside>
      {moment && (
        <div
          key={moment.id}
          className={
            (epic ? "chapter-cinema" : "moment-banner") + " cue-" + moment.cue
          }
          role="status"
          aria-live="polite"
        >
          {epic && (
            <>
              <img src={assets.nation} alt="" />
              <div className="cinema-shade" />
              <div className="cinema-orbit" aria-hidden="true" />
              <div className="cinema-particles" aria-hidden="true">
                {Array.from({ length: 12 }, (_, i) => (
                  <i
                    key={i}
                    style={{ "--particle": i } as React.CSSProperties}
                  />
                ))}
              </div>
            </>
          )}
          <div className="moment-copy">
            <span>
              {moment.phase !== undefined
                ? `CAPÍTULO ${String(moment.phase + 1).padStart(2, "0")} / 08`
                : "CONSEJO DE AURORA"}
            </span>
            <strong>{moment.title}</strong>
            <p>{moment.detail}</p>
            <div className="moment-line" aria-hidden="true" />
          </div>
          <button
            aria-label="Omitir transición"
            className="skip-cinema"
            onClick={() => setMoment(null)}
          >
            <X size={15} />
            <span>Omitir</span>
          </button>
        </div>
      )}
    </>
  );
}
