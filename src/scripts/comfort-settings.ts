/**
 * Comfort Settings controller.
 * Ported from ECHOE's accessibility panel. Persists user choices in
 * localStorage and applies them as <body> classes + a font-size variable.
 *
 * Modes: calm (reduce motion), focus (clean reading), contrast (high contrast).
 * Plus a text-size stepper and a Quick Exit button.
 */

const STORE_KEY = "marginalia.comfort";

type ComfortState = {
  calm: boolean;
  focus: boolean;
  contrast: boolean;
  textScale: number; // percent, 80-150
};

const DEFAULT_STATE: ComfortState = {
  calm: false,
  focus: false,
  contrast: false,
  textScale: 100,
};

function readState(): ComfortState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<ComfortState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeState(state: ComfortState) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

function applyState(state: ComfortState) {
  const body = document.body;
  body.classList.toggle("mode-calm", state.calm);
  body.classList.toggle("mode-focus", state.focus);
  body.classList.toggle("mode-contrast", state.contrast);
  // The site is laid out in px, so a root font-size change does nothing.
  // Scale the whole page with zoom instead, which affects px text too.
  try {
    (document.body.style as CSSStyleDeclaration & { zoom?: string }).zoom = String(state.textScale / 100);
  } catch {
    document.documentElement.style.fontSize = `${state.textScale}%`;
  }

  // Reflect toggle UI
  for (const mode of ["calm", "focus", "contrast"] as const) {
    const card = document.querySelector<HTMLElement>(`[data-mode="${mode}"]`);
    if (!card) continue;
    const on = state[mode];
    card.classList.toggle("active", on);
    const stateEl = card.querySelector(".mode-state");
    if (stateEl) stateEl.textContent = on ? "ON" : "OFF";
  }
  const display = document.getElementById("comfortSizeDisplay");
  if (display) display.textContent = `${state.textScale}%`;
}

export function initComfortSettings() {
  const fab = document.getElementById("comfortFab");
  const panel = document.getElementById("comfortPanel");
  const closeBtn = document.getElementById("comfortClose");
  if (!fab || !panel) return;

  let state = readState();
  applyState(state);

  const openPanel = () => {
    panel.classList.add("open");
    fab.setAttribute("aria-expanded", "true");
  };
  const closePanel = () => {
    panel.classList.remove("open");
    fab.setAttribute("aria-expanded", "false");
  };

  fab.addEventListener("click", () => {
    panel.classList.contains("open") ? closePanel() : openPanel();
  });
  closeBtn?.addEventListener("click", closePanel);

  // Mode toggles
  for (const mode of ["calm", "focus", "contrast"] as const) {
    const card = document.querySelector<HTMLElement>(`[data-mode="${mode}"]`);
    card?.addEventListener("click", () => {
      state = { ...state, [mode]: !state[mode] };
      writeState(state);
      applyState(state);
    });
  }

  // Text size
  const clamp = (n: number) => Math.min(150, Math.max(80, n));
  document.getElementById("comfortSmaller")?.addEventListener("click", () => {
    state = { ...state, textScale: clamp(state.textScale - 10) };
    writeState(state);
    applyState(state);
  });
  document.getElementById("comfortLarger")?.addEventListener("click", () => {
    state = { ...state, textScale: clamp(state.textScale + 10) };
    writeState(state);
    applyState(state);
  });
  document.getElementById("comfortReset")?.addEventListener("click", () => {
    state = { ...state, textScale: 100 };
    writeState(state);
    applyState(state);
  });

  // Quick exit, leave immediately and try to scrub history.
  document.getElementById("comfortExit")?.addEventListener("click", () => {
    try {
      window.location.replace("https://www.google.com");
    } catch {
      window.location.href = "https://www.google.com";
    }
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });
}
