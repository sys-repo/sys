let _ctx: AudioContext | null = null;
const getCtx = () => (_ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)());

/**
 * Soft UI chime with a click-free tail.
 */
export async function ding(
  opts: {
    baseHz?: number;
    overtoneHz?: number;
    gain?: number;
    duration?: number; // seconds (main decay length)
    detuneCents?: number;
  } = {},
) {
  const { baseHz = 880, overtoneHz = 1320, gain = 0.18, duration = 0.6, detuneCents = 12 } = opts;

  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  const now = ctx.currentTime;

  // Oscillators
  const osc = ctx.createOscillator();
  const overtone = ctx.createOscillator();
  osc.type = 'triangle';
  overtone.type = 'sine';
  osc.frequency.setValueAtTime(baseHz, now);
  osc.detune.setValueAtTime(detuneCents, now);
  overtone.frequency.setValueAtTime(overtoneHz, now);

  // Gains (envelopes)
  const amp = ctx.createGain();
  const overtoneAmp = ctx.createGain();

  // Main envelope: quick attack → exponential decay to near-zero
  amp.gain.setValueAtTime(0, now);
  amp.gain.linearRampToValueAtTime(gain, now + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0002, now + duration);

  // Overtone: quieter + same decay
  overtoneAmp.gain.setValueAtTime(gain * 0.3, now);
  overtoneAmp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  // Wire up
  osc.connect(amp).connect(ctx.destination);
  overtone.connect(overtoneAmp).connect(ctx.destination);

  // Start
  osc.start(now);
  overtone.start(now);

  // Tiny safety tail so we stop when envelope is ~0 (prevents click)
  const stopAt = now + duration + 0.03;
  osc.stop(stopAt);
  overtone.stop(stopAt);

  // Optional: disconnect after stop
  osc.onended = () => amp.disconnect();
  overtone.onended = () => overtoneAmp.disconnect();
}
