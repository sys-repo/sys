import { type t, D } from './common.ts';

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
export const getStream: t.MediaVideoLib['getStream'] = async (args) => {
  const { constraints = D.constraints, preferPhoneCamera } = args;
  const filter = (args.filter ?? '').trim();

  /**
   * Retrieve the raw camera/mic stream.
   */
  const raw = await navigator.mediaDevices.getUserMedia(constraints);

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

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d')!;
  if (filter) ctx.filter = filter;

  /**
   * Copy each video frame into the canvas.
   */
  function draw() {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(draw);
  }
  draw(); // NB: Kick off the loop.

  /**
   * Capture the canvas as a MediaStream and
   * copy across original audio track(s).
   */
  const filtered = canvas.captureStream(30); // NB: 30 fps.
  raw.getAudioTracks().forEach((t) => filtered.addTrack(t));

  /**
   * Helper: House-keeping (stop everything in one call).
   */
  filtered.addEventListener('inactive', () => {
    raw.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  });

  // Finish up.
  return filtered;
};
