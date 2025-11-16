import { logInfo, Try } from './common.ts';

// Identify likely virtual mics (Camo/Loopback/etc).
export function isVirtualLabel(label: string) {
  return /virtual|camo|vb-?audio|blackhole|soundflower|loopback/i.test(label);
}

/**
 * Optional: warm up the audio track by actually pulling it through Web Audio.
 */
export async function warmAudio(stream: MediaStream) {
  const { result } = await Try.run(async () => {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      // Fire-and-forget; Try swallows any rejection.
      void Try.run(() => ctx.resume());
    }

    const src = ctx.createMediaStreamSource(stream);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(gain).connect(ctx.destination);
  });

  // Optional: debug logging if warm-up fails.
  if (!result.ok) {
    console.warn('warmAudio failed', result.error);
  }
}

export const withAudio = (origin: MediaStream, target: MediaStream): MediaStream => {
  if (target.getAudioTracks().length === 0) {
    origin.getAudioTracks().forEach((t) => target.addTrack(t.clone())); // isolate lifecycles
  } else {
    target.getAudioTracks().forEach((t) => {
      if (t.readyState === 'ended') Try.run(() => target.removeTrack(t));
    });
    if (target.getAudioTracks().length === 0) {
      origin.getAudioTracks().forEach((t) => target.addTrack(t.clone()));
    }
  }
  return target;
};

export async function applyVirtualConstraintsIfNeeded(s: MediaStream) {
  const [a] = s.getAudioTracks();
  if (!a) return;
  const label = a.label ?? '';
  if (!isVirtualLabel(label)) return;

  await Try.run(async () => {
    await a.applyConstraints({
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    } as MediaTrackConstraints);
    logInfo('applied virtual-mic constraints (EC/NS/AGC disabled)');
  });
}
