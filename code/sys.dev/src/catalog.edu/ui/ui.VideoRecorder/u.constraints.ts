/**
 * Media device constraint helpers.
 * - Requests 4:3 video.
 * - Requests low-latency, raw audio (DSP off by default).
 * - Feature-detects `latency` constraint to avoid TS/dom errors.
 */

export type AudioConstraints = MediaTrackConstraints & {
  readonly latency?: number | ConstrainDoubleRange;
};

/**
 * Detect and apply low-latency hint if supported.
 */
function addLatencyIfSupported(c: AudioConstraints): AudioConstraints {
  const supports = !!navigator.mediaDevices?.getSupportedConstraints?.().latency;
  return supports ? { ...c, latency: { ideal: 0.01 } } : c;
}

/**
 * Preferred camera settings for 4:3 aspect ratio, medium resolution, stable sync.
 */
export function bestVideo(camId?: string): MediaTrackConstraints {
  return {
    ...(camId ? { deviceId: { exact: camId } } : {}),
    aspectRatio: { ideal: 4 / 3 },
    width: { ideal: 1280 },
    height: { ideal: 960 },
    frameRate: { ideal: 30, max: 30 }, // lower load → better A/V sync
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
  const base: AudioConstraints = {
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
