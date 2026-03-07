import { type t, Process } from './common.ts';
import { nextOutPath } from './u.file.name.ts';

/**
 * WEBM (VP9/Opus) → MP4 (H.264/AAC)
 * Quality-first (CRF), yuv420p for broad compatibility.
 * Notes:
 * - Normalize to CFR 30 fps.
 * - Explicit BT.709 TV-range color tags to avoid player gamma drift.
 * - Alpha is not supported in H.264/MP4; yuv420p flattens (no alpha).
 */
export const webmToMp4: t.VideoTool.WebmToMp4 = async (args) => {
  const { src } = args;
  const out = args.out ?? (await nextOutPath({ src, toExt: '.mp4' }));
  const crf = args.crf ?? 18;
  const aac = args.aacKbps ?? 160;

  // Show the exact target path before encoding:
  const res = await Process.run(
    `
    ffmpeg -y -i "${src}" \
      -map 0:v -map 0:a? \
      -color_range tv -colorspace bt709 -color_trc bt709 -color_primaries bt709 \
      -fps_mode:v cfr -r 30 \
      -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -crf ${crf} \
      -c:a aac -b:a ${aac}k -ac 2 \
      -movflags +faststart -video_track_timescale 90000 \
      "${out}"
  `,
    { silent: true },
  );
  ensureOk(res, 'webm→mp4');
  return out;
};

/**
 * MP4 (H.264/AAC) → WEBM (VP9/Opus)
 * Small-by-default (CRF single-pass).
 * Notes:
 * - Normalize to CFR 30 fps.
 * - Explicit BT.709 TV-range color tags to align with MP4 path.
 */
export const mp4ToWebm: t.VideoTool.Mp4ToWebm = async (args) => {
  const { src } = args;
  const out = args.out ?? (await nextOutPath({ src, toExt: '.webm' }));
  const crf = args.crf ?? 32;
  const opus = args.opusKbps ?? 96;

  // Show the exact target path before encoding:
  const res = await Process.run(
    `
    ffmpeg -y -i "${src}" \
      -map 0:v -map 0:a? \
      -color_range tv -colorspace bt709 -color_trc bt709 -color_primaries bt709 \
      -fps_mode:v cfr -r 30 \
      -c:v libvpx-vp9 -b:v 0 -crf ${crf} \
      -row-mt 1 -tile-columns 2 -threads 8 -g 240 -aq-mode 0 -cpu-used 2 \
      -c:a libopus -b:a ${opus}k -ac 2 \
      "${out}"
  `,
    { silent: true },
  );
  ensureOk(res, 'mp4→webm');
  return out;
};

/**
 * Helpers:
 */
const ensureOk = (res: Awaited<ReturnType<typeof Process.run>>, ctx: string) => {
  if (!res.success) {
    const msg = res.text.stderr.trim() || res.text.stdout.trim() || 'ffmpeg failed';
    throw new Error(`${ctx}: ${msg}`);
  }
};
