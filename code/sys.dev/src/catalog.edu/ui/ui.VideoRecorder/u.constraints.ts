import { type t, D, Num } from './common.ts';

/**
 * Preferred camera settings for 4:3 aspect ratio, medium→high resolution, stable sync.
 * - Biases toward native 4:3 sensor modes (no downscale).
 * - Prefers 60 fps when available, fine at 30 fps otherwise.
 * - Uses resizeMode 'none' to discourage UA internal scaling.
 */
export function bestVideo(
  camId?: string,
  opts?: { aspectRatio?: string | number; fps60?: boolean },
): MediaTrackConstraints {
  const aspectRatio =
    Num.Ratio.parse(opts?.aspectRatio ?? D.aspectRatio) ?? Num.Ratio.parse(D.aspectRatio)!;

  const evenHeight = (w: number) => {
    const h = Math.round(w / aspectRatio);
    return (h & 1) === 0 ? h : h + 1; // ensure even height for encoder alignment
  };

  const width = 1920; // target high 4:3 native mode (1920×1440)
  const height = evenHeight(width);
  const want60 = opts?.fps60 !== false;

  return {
    ...(camId ? { deviceId: { exact: camId } } : {}),
    aspectRatio: { ideal: aspectRatio },
    width: { min: 1280, ideal: width, max: 2560 },
    height: {
      min: evenHeight(1280),
      ideal: height,
      max: evenHeight(2560),
    },
    frameRate: want60 ? { min: 30, ideal: 60, max: 60 } : { ideal: 30 },
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
  return addLatencyIfSupported(base);
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
function addLatencyIfSupported(c: t.AudioConstraints): t.AudioConstraints {
  /** Detect and apply low-latency hint if supported. */
  const supports = !!navigator.mediaDevices?.getSupportedConstraints?.().latency;
  return supports ? { ...c, latency: { ideal: 0.01 } } : c;
}
