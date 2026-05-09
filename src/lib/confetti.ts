import confetti from "canvas-confetti";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const getThemedColors = (): string[] => {
  if (typeof window === "undefined") return ["#8b5cf6", "#ec4899", "#06b6d4"];
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
  return colors.length ? colors : ["#8b5cf6", "#ec4899", "#06b6d4"];
};

export const celebrate = () => {
  if (prefersReducedMotion()) return;
  const colors = getThemedColors();

  confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 45,
    origin: { y: 0.7 },
    colors,
    scalar: 0.9,
    disableForReducedMotion: true,
  });

  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors,
      disableForReducedMotion: true,
    });
  }, 200);
};
