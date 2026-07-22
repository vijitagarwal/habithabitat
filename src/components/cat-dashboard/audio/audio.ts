// ─────────────────────────────────────────────────────────────
// Web Audio API — tone() and bell()
// Exact TypeScript port of audio.js
// ─────────────────────────────────────────────────────────────

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return _ctx;
}

export function tone(freq: number, dur: number, vol = 0.3): void {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur + 0.1);
  } catch {
    // Audio context not available (e.g., SSR or no permission)
  }
}

export function bell(): void {
  try {
    const ctx = getCtx();
    const freqs = [220, 330, 440];
    freqs.forEach((freq) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.5);
    });
  } catch {
    // Silent fail
  }
}

export function celebration(): void {
  tone(523, 0.3, 0.4);
  setTimeout(() => tone(659, 0.4, 0.4), 350);
}

export function resumeCtx(): void {
  if (_ctx?.state === 'suspended') _ctx.resume();
}
