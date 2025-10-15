import { type t, Path, Process } from './common.ts';

/**
 * WEBM (VP9/Opus) → MP4 (H.264/AAC)
 * Quality-first (CRF), yuv420p for broad compatibility.
 * Notes:
 * - Drop -r and -vsync (ffmpeg 7: -vsync deprecated; defaults preserve source fps).
 * - Alpha is not supported in H.264/MP4; yuv420p flattens (no alpha).
 */
export const webmToMp4: t.WebmToMp4 = async (args) => {
  const { src } = args;
  const out = args.out ?? replaceExt(src, '.mp4');
  const crf = args.crf ?? 18;
  const aac = args.aacKbps ?? 160;

  const res = await Process.run(`
    ffmpeg -y -i "${src}" \
      -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -crf ${crf} \
      -c:a aac -b:a ${aac}k -ac 2 -movflags +faststart \
      "${out}"
  `);
  ensureOk(res, 'webm→mp4');

  return out;
};

/**
 * MP4 (H.264/AAC) → WEBM (VP9/Opus)
 * Small-by-default (CRF single-pass). You can later add a 2-pass path if needed.
 */
export const mp4ToWebm: t.Mp4ToWebm = async (args) => {
  const { src } = args;
  const out = args.out ?? replaceExt(src, '.webm');
  const crf = args.crf ?? 32;
  const opus = args.opusKbps ?? 96;

  const res = await Process.run(`
    ffmpeg -y -i "${src}" \
      -c:v libvpx-vp9 -b:v 0 -crf ${crf} \
      -row-mt 1 -tile-columns 2 -threads 8 -g 240 -aq-mode 0 -cpu-used 2 \
      -c:a libopus -b:a ${opus}k -ac 2 \
      "${out}"
  `);
  ensureOk(res, 'mp4→webm');

  return out;
};

/**
 * Helpers:
 */
const replaceExt = (file: string, toExt: string) => {
  /** swap a file's extension */
  const dir = Path.dirname(file);
  const stem = Path.basename(file, Path.extname(file));
  return Path.join(dir, `${stem}${toExt}`);
};

const ensureOk = (res: Awaited<ReturnType<typeof Process.run>>, ctx: string) => {
  if (!res.success) {
    const msg = res.text.stderr.trim() || res.text.stdout.trim() || 'ffmpeg failed';
    throw new Error(`${ctx}: ${msg}`);
  }
};
