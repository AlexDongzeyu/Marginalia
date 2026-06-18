/**
 * Living Margin behaviours:
 *  - reveal: fade + slide margin notes / cards in as they scroll into view.
 *  - anchor link: hovering an anchored phrase lifts its paired margin note
 *    (and vice-versa), connected by the `data-anchor` / `data-note` ids.
 * Respects prefers-reduced-motion (and Calm Mode disables transitions in CSS).
 */
export function initLivingMargin() {
  const reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const reveals = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach((n) => n.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    reveals.forEach((n) => io.observe(n));
  }

  // Anchor <-> note hover linking
  document.querySelectorAll<HTMLElement>("[data-anchor]").forEach((anchor) => {
    const id = anchor.getAttribute("data-anchor");
    const note = document.querySelector<HTMLElement>(`[data-note="${id}"]`);
    const enter = () => {
      anchor.style.background = "rgba(194,65,12,.12)";
      if (note) {
        note.style.transition = "opacity .6s ease, transform .25s ease, box-shadow .25s ease";
        note.style.transform = "scale(1.04)";
        note.style.boxShadow = "0 8px 20px -8px rgba(40,30,20,.4)";
      }
    };
    const leave = () => {
      anchor.style.background = "transparent";
      if (note) {
        note.style.transform = "";
        note.style.boxShadow = "";
      }
    };
    anchor.addEventListener("mouseenter", enter);
    anchor.addEventListener("mouseleave", leave);
    if (note) {
      note.addEventListener("mouseenter", enter);
      note.addEventListener("mouseleave", leave);
    }
  });
}
