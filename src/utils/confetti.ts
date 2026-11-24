export const triggerConfetti = async (type: "level" | "quiz" | "certification") => {
  const confetti = (await import("canvas-confetti")).default;
  if (type === "certification") {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#fbbf24", "#f59e0b", "#fb923c"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#fbbf24", "#f59e0b", "#fb923c"]
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  } else {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: type === "level" ? ["#10b981", "#34d399", "#059669"] : ["#3b82f6", "#60a5fa", "#2563eb"]
    });
  }
};
