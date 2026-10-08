import { BookOpen, CirclePlay, Compass, FilePlus2, FileUp, GraduationCap, Presentation } from "lucide-react";

/** Main screen: the three experiences plus continue, learn and how to play. */
export default function HomeActions({ onStory, onImport, onCreate, onContinue, onLearn, onHow, onPresent, canContinue }: { onStory: () => void; onImport: () => void; onCreate: () => void; onContinue: () => void; onLearn: () => void; onHow: () => void; onPresent: () => void; canContinue: boolean }) {
  const main = [
    { title: "Jugar historia", text: "Nueve misiones oficiales en el Reino de Liones: aprende con un caso diseñado.", Icon: Compass, action: onStory, tone: "story" },
    { title: "Importar proyecto", text: "Convierte un PDF o un Excel en una estructura académica editable y juégalo.", Icon: FileUp, action: onImport, tone: "import" },
    { title: "Crear proyecto", text: "Formula tu propio proyecto paso a paso; el sistema revisa su coherencia.", Icon: FilePlus2, action: onCreate, tone: "create" },
  ];
  return (
    <section className="home-actions" aria-label="Formas de jugar">
      <div className="home-actions-main">
        {main.map(({ title, text, Icon, action, tone }) => (
          <button key={title} type="button" className={"home-action " + tone} onClick={action}>
            <Icon size={26} aria-hidden />
            <strong>{title}</strong>
            <span>{text}</span>
          </button>
        ))}
      </div>
      <div className="home-actions-sub">
        {canContinue && (
          <button type="button" onClick={onContinue}>
            <CirclePlay size={17} aria-hidden /> Continuar
          </button>
        )}
        <button type="button" onClick={onLearn}>
          <GraduationCap size={17} aria-hidden /> Aprender
        </button>
        <button type="button" onClick={onHow}>
          <BookOpen size={17} aria-hidden /> Cómo jugar
        </button>
        <button type="button" onClick={onPresent} title="Una partida de ejemplo completa y resuelta para mostrar el simulador">
          <Presentation size={17} aria-hidden /> Modo presentación
        </button>
      </div>
    </section>
  );
}
