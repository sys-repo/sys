import { type t, D, Is, logInfo } from './common.ts';

/**
 * Build a MediaStream whose video is run through a CSS-filter pipeline.
 *
 * @param constraints – any valid getUserMedia constraints (eg { video: true, audio: true })
 * @param filter      – any CSS filter string, eg 'brightness(120%) contrast(110%)'
 *
 * The returned stream has:
 *   • filtered video track (from the canvas).
 *   • original audio track(s) from the raw camera.
 */
export const getStream: t.MediaVideoLib['getStream'] = async (
  streamOrConstraints = D.constraints,
  options = {},
) => {
  const filter = (options.filter ?? '').trim();
  const zoom = wrangle.zoom(options.zoom);
  logInfo('getStream:start', { filter, zoom });

  /**
   * Retrieve the raw camera/mic stream.
   */
  const raw = Is.constraints(streamOrConstraints)
    ? await navigator.mediaDevices.getUserMedia(streamOrConstraints)
    : streamOrConstraints;

  /**
   * (Early Edit): no filter/zoom ➜ simply reuse the raw stream.
   */
  const wantsZoom = (zoom?.factor ?? 1) !== 1;
  if (!filter && !wantsZoom) return { raw, filtered: raw };

  /**
   * Create hidden Video + Canvas elements.
   */
  const video = Object.assign(document.createElement('video'), {
    srcObject: raw,
    muted: true,
    playsInline: true,
    style: 'display: none',
  }) as HTMLVideoElement;
  await video.play(); // NB: wait until metadata ready.

  const w = video.videoWidth;
  const h = video.videoHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d')!;
  if (filter) ctx.filter = filter;

  /**
   * Copy each video frame into the canvas:
   */
  let rafId = 0;
  let stopped = false;
  function draw() {
    if (stopped) return;

    ctx.clearRect(0, 0, w, h);
    if (filter) ctx.filter = filter;
    if (zoom.factor === 1) {
      ctx.drawImage(video, 0, 0, w, h);
    } else {
      // Normalize center coords → absolute pixels.
      const cx = (zoom.centerX ?? 0.5) * w;
      const cy = (zoom.centerY ?? 0.5) * h;
      const f = zoom.factor;
      const sw = w / f;
      const sh = h / f;
      const sx = cx - sw / 2;
      const sy = cy - sh / 2;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    }

    rafId = requestAnimationFrame(draw); // ← RECURSION 🌳
  }
  draw(); // NB: Kick off the draw-loop.

  /**
   * Capture the canvas as a MediaStream and
   * copy across original audio track(s).
   */
  const filtered = canvas.captureStream(30); // NB: 30-fps.
  raw.getAudioTracks().forEach((t) => filtered.addTrack(t));

  /**
   * Helper: House-keeping (stop everything in one call).
   */
  filtered.addEventListener('inactive', () => {
    try {
      cancelAnimationFrame(rafId);
    } catch {}
    stopped = true;
    raw.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  });

  // Finish up.
  logInfo('getStream:end', { tracks: filtered.getTracks().map((t) => `${t.kind}:${t.label}`) });
  return { raw, filtered };
};

/**
 * Helpers:
 */
const wrangle = {
  zoom(input: Partial<t.MediaZoomValues> = {}): t.MediaZoomValues {
    const { factor = 1, centerX = 0.5, centerY = 0.4 } = input;
    return { factor, centerX, centerY };
  },
} as const;
