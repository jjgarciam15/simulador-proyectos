/**
 * Number fields are typed only: the arrow keys and the mouse wheel do not step the value
 * (the spin buttons are hidden in styles.css). The wheel still scrolls the page.
 */
const isNumberInput = (t: EventTarget | null): t is HTMLInputElement => t instanceof HTMLInputElement && t.type === "number";

export function typedNumberInputsOnly(doc: Document = document) {
  doc.addEventListener(
    "keydown",
    (e) => {
      if ((e.key === "ArrowUp" || e.key === "ArrowDown") && isNumberInput(e.target)) e.preventDefault();
    },
    true,
  );
  // A focused number field changes on wheel in some browsers: release the focus so the page scrolls instead.
  doc.addEventListener(
    "wheel",
    (e) => {
      if (isNumberInput(e.target) && doc.activeElement === e.target) e.target.blur();
    },
    { capture: true, passive: true },
  );
}
