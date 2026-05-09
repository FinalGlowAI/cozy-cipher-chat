import confetti from "canvas-confetti";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const COLOR_PALETTES: string[][] = [
  // Neon Purple (brand)
  ["#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed"],
  // Cyberpunk Cyan/Magenta
  ["#06b6d4", "#22d3ee", "#ec4899", "#f472b6", "#fbbf24"],
  // Golden Luxury
  ["#fbbf24", "#f59e0b", "#fcd34d", "#d97706", "#fffbeb"],
  // Ocean Deep
  ["#0ea5e9", "#38bdf8", "#22d3ee", "#0369a1", "#67e8f9"],
  // Sunset Fire
  ["#f97316", "#fb923c", "#ef4444", "#fca5a5", "#fdba74"],
  // Emerald Matrix
  ["#10b981", "#34d399", "#6ee7b7", "#059669", "#a7f3d0"],
  // Cosmic Rainbow
  ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"],
];

const getThemedColors = (): string[] => {
  if (typeof window === "undefined") return COLOR_PALETTES[0];
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string) => {
    const v = styles.getPropertyValue(name).trim();
    return v ? `hsl(${v})` : null;
  };
  const colors = [
    read("--primary"),
    read("--accent"),
    read("--secondary"),
  ].filter(Boolean) as string[];
  return colors.length ? colors : COLOR_PALETTES[0];
};

let lastPaletteIndex = -1;

const getRandomPalette = (): string[] => {
  let idx: number;
  do {
    idx = Math.floor(Math.random() * COLOR_PALETTES.length);
  } while (idx === lastPaletteIndex && COLOR_PALETTES.length > 1);
  lastPaletteIndex = idx;
  return COLOR_PALETTES[idx];
};

export const celebrate = (options?: { colors?: string[]; randomize?: boolean }) => {
  if (prefersReducedMotion()) return;

  const colors = options?.colors
    ? options.colors
    : options?.randomize !== false
    ? getRandomPalette()
    : getThemedColors();

  // Main burst from center-bottom
  confetti({
    particleCount: 90,
    spread: 80,
    startVelocity: 50,
    origin: { y: 0.75 },
    colors,
    scalar: 1,
    disableForReducedMotion: true,
  });

  // Side bursts
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 55,
      spread: 60,
      origin: { x: 0, y: 0.8 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 50,
      angle: 125,
      spread: 60,
      origin: { x: 1, y: 0.8 },
      colors,
      disableForReducedMotion: true,
    });
  }, 150);

  // Small finishing pops
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 100,
      startVelocity: 30,
      origin: { y: 0.7 },
      colors,
      scalar: 0.8,
      disableForReducedMotion: true,
    });
  }, 350);
};

// Convenience exports for specific moods
export const celebrateGold = () => celebrate({ colors: COLOR_PALETTES[2], randomize: false });
export const celebrateCyber = () => celebrate({ colors: COLOR_PALETTES[1], randomize: false });
export const celebrateOcean = () => celebrate({ colors: COLOR_PALETTES[3], randomize: false });
export const celebrateFire = () => celebrate({ colors: COLOR_PALETTES[4], randomize: false });
export const celebrateRainbow = () => celebrate({ colors: COLOR_PALETTES[6], randomize: false });
