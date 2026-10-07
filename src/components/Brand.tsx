import { useId } from "react";

/**
 * Emblema de Ludo · Reino de Liones: a crimson heraldic shield with a gold crown and a die
 * (the game and the kingdom in one mark). Pure SVG, readable from 16 px (favicon) to the home header.
 */
export function Crest({ size = 40, title }: { size?: number; title?: string }) {
  // Unique gradient ids: several crests can share a page.
  const id = useId().replace(/:/g, ""),
    field = "crest-field-" + id,
    gold = "crest-gold-" + id;
  return (
    <svg className="crest" width={size} height={size * 1.12} viewBox="0 0 64 72" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={field} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8323f" />
          <stop offset="1" stopColor="#7a1424" />
        </linearGradient>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="0.55" stopColor="#f2c14e" />
          <stop offset="1" stopColor="#b8862a" />
        </linearGradient>
      </defs>
      {/* Shield */}
      <path d="M32 3 L59 11 V33 C59 51 47 63 32 69 C17 63 5 51 5 33 V11 Z" fill={`url(#${field})`} stroke={`url(#${gold})`} strokeWidth="3.2" strokeLinejoin="round" />
      {/* Crown */}
      <path d="M18 24 L21 13 L27 19 L32 10 L37 19 L43 13 L46 24 Z" fill={`url(#${gold})`} stroke="#7a5414" strokeWidth="0.8" strokeLinejoin="round" />
      <circle cx="21" cy="12.5" r="1.8" fill="#ffe9a8" />
      <circle cx="32" cy="9.5" r="1.9" fill="#ffe9a8" />
      <circle cx="43" cy="12.5" r="1.8" fill="#ffe9a8" />
      {/* Die */}
      <rect x="20" y="29" width="24" height="24" rx="5" fill="#fff7e2" stroke={`url(#${gold})`} strokeWidth="1.6" />
      <g fill="#7a1424">
        <circle cx="26.5" cy="35.5" r="2.3" />
        <circle cx="37.5" cy="35.5" r="2.3" />
        <circle cx="32" cy="41" r="2.3" />
        <circle cx="26.5" cy="46.5" r="2.3" />
        <circle cx="37.5" cy="46.5" r="2.3" />
      </g>
    </svg>
  );
}
/** Wordmark: the crest, «LUDO» and an optional subtitle. */
export function Wordmark({ subtitle, compact = false }: { subtitle?: string; compact?: boolean }) {
  return (
    <>
      <Crest size={compact ? 30 : 44} />
      <span className="wordmark">
        <b>LUDO</b>
        {subtitle && <small>{subtitle}</small>}
      </span>
    </>
  );
}
