import { type t, D, Is, logInfo, Try } from './common.ts';

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
  let raw: MediaStream;
  if (Is.constraints(streamOrConstraints)) {
    const res = await Try.catch(() => navigator.mediaDevices.getUserMedia(streamOrConstraints));
    if (!res.ok) throw res.error;
    raw = res.data;
  } else {
    raw = streamOrConstraints;
  }

  /**
   * (Early Edit): no filter/zoom ➜ simply reuse the raw stream.
   */
  const wantsZoom = (zoom?.factor ?? 1) !== 1;
  if (!filter && !wantsZoom) return { raw, filtered: raw };

  /**
   * Create hidden Video + Canvas elements.
   */
  type V = HTMLVideoElement & { srcObject: MediaStream | null };
  const video = Object.assign(document.createElement('video'), {
    srcObject: raw,
    muted: true,
    playsInline: true,
    style: 'display: none',
  }) as V;

  // NB: Ensure metadata is loaded so width/height are valid.
  await ensureMetadata(video);
  await safePlay(video); // ok if this no-ops on some engines

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
   * copy ("clone") across original audio track(s).
   */
  const filtered = canvas.captureStream(30); // NB: 30-fps.
  raw.getAudioTracks().forEach((t) => filtered.addTrack(t.clone()));

  function onInactive() {
    Try.catch(() => cancelAnimationFrame(rafId));
    stopped = true;
    releaseVideo(video);
    stopTracks(raw);
    shrink(canvas);
  }

  /**
   * Helper: House-keeping (stop everything in one call).
   */
  filtered.addEventListener('inactive', onInactive, { once: true });

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

/**
 * Wait for valid video metadata (width/height) before sizing canvas.
 */
async function ensureMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 1 && video.videoWidth && video.videoHeight) return;

  // Wait for metadata, but don't hang forever if a driver never fires it.
  await Promise.race<void>([
    new Promise<void>((resolve) => {
      video.addEventListener('loadedmetadata', () => resolve(), { once: true });
    }),
    new Promise<void>((resolve) => {
      // Timeout fallback: allow pipeline to proceed; caller should handle 0×0 defensively.
      setTimeout(() => resolve(), 1200);
    }),
  ]);

  // One more frame gives some engines a beat to populate dimensions post-event.
  if (!(video.videoWidth && video.videoHeight)) {
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
}

/**
 * Attempt to start playback; some engines may no-op without user gesture.
 */
async function safePlay(video: HTMLVideoElement): Promise<void> {
  // NB: Ignore errors; drawing from the current frame is still fine post-metadata.
  await Try.catch(() => video.play());
}

/**
 * Stop all tracks on a MediaStream (defensive).
 */
function stopTracks(stream: MediaStream) {
  for (const t of stream.getTracks()) {
    Try.catch(() => t.stop());
  }
}

/**
 * Release a video element's backing stream.
 */
function releaseVideo(v: HTMLVideoElement & { srcObject: MediaStream | null }) {
  Try.catch(() => v.pause?.());
  Try.catch(() => (v.srcObject = null));
}

/**
 * Hint GC by shrinking the canvas to 0x0.
 */
function shrink(c: HTMLCanvasElement) {
  Try.catch(() => {
    c.width = 0;
    c.height = 0;
  });
}
