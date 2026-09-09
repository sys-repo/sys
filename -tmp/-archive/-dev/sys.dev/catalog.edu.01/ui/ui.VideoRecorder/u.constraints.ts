import { type t, D, Num } from './common.ts';

/**
 * Preferred camera settings for 4:3 aspect ratio, medium→high resolution, stable sync.
 */
export function bestVideo(
  camId?: string,
  opts?: { aspectRatio?: string | number },
): MediaTrackConstraints {
  const aspectRatio = wrangle.aspectRatio(opts?.aspectRatio);

  const width = 1920; // target high 4:3 native mode (1920×1440)

  return {
    ...(camId ? { deviceId: { exact: camId } } : {}),
    aspectRatio: { exact: aspectRatio },
    width: { ideal: width },
    frameRate: { ideal: 30, max: 30, min: 30 },
    resizeMode: 'none',
  };
}

/**
 * Preferred microphone settings for predictable, low-latency capture.
 */
export function bestAudio(
  micId?: string,
  mode: 'clean' | 'voice' = 'clean',
): MediaTrackConstraints {
  const voice = mode === 'voice';
  const base: t.AudioConstraints = {
    ...(micId ? { deviceId: { exact: micId } } : {}),
    echoCancellation: voice || false,
    noiseSuppression: voice || false,
    autoGainControl: voice || false,
    sampleRate: 48000,
    channelCount: 1,
    sampleSize: 16,
  };
  return wrangle.latencyIfSupported(base);
}

/**
 * Simplest possible microphone constraint (no DSP, no latency hints).
 */
export function simpleAudio(micId?: string): MediaTrackConstraints {
  return micId ? { deviceId: { exact: micId } } : {};
}

/**
 * Helpers:
 */
const wrangle = {
  latencyIfSupported(c: t.AudioConstraints): t.AudioConstraints {
    /** Detect and apply low-latency hint if supported. */
    const supports = !!navigator.mediaDevices?.getSupportedConstraints?.().latency;
    return supports ? { ...c, latency: { ideal: 0.01 } } : c;
  },

  aspectRatio(input?: string | number) {
    return Num.Ratio.parse(input ?? D.aspectRatio) ?? Num.Ratio.parse(D.aspectRatio)!;
  },
} as const;
