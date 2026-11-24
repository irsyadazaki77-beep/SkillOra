/**
 * Web Audio API synthesizer for retro/modern UI sound effects.
 * 100% self-contained with no external assets.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

export const playSound = (type: "click" | "correct" | "wrong" | "levelUp" | "claim" | "laser" | "success") => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Check if sounds are disabled in localStorage
    if (!isSoundEnabled()) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case "click":
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case "correct":
        // Sweet major chord arpeggio
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.24);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        
        osc.start(now);
        osc.stop(now + 0.45);
        break;

      case "wrong":
        // Descending buzzing sound
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case "levelUp":
        // Epic rising scale
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
        osc.type = "sine";
        gain.gain.setValueAtTime(0.1, now);
        
        notes.forEach((freq, i) => {
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
        });
        
        gain.gain.linearRampToValueAtTime(0.15, now + notes.length * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + notes.length * 0.07 + 0.4);
        
        osc.start(now);
        osc.stop(now + notes.length * 0.07 + 0.4);
        break;

      case "claim":
        // Sparkling chime sound
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case "laser":
        // Fast descending sweep
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case "success":
        // Triumphant double chime
        osc.type = "triangle";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.1); // A5
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc.start(now);
        osc.stop(now + 0.35);
        break;
    }
  } catch (e) {
    console.warn("Web Audio API not supported or interaction required.", e);
  }
};

export const isSoundEnabled = (): boolean => {
  try {
    return localStorage.getItem("skillora_sound_enabled") !== "false";
  } catch {
    return true;
  }
};

export const setSoundEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem("skillora_sound_enabled", enabled ? "true" : "false");
  } catch (e) {
    console.warn("Could not save sound setting:", e);
  }
};

