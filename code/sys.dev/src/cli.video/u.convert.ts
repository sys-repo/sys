import { type t, Path, Process } from './common.ts';

/** swap a file's extension */
const replaceExt = (file: string, toExt: string) => {
  const dir = Path.dirname(file);
  const stem = Path.basename(file, Path.extname(file));
  return Path.join(dir, `${stem}${toExt}`);
};

/**
 * WEBM (VP9/Opus) → MP4 (H.264/AAC)
 * Quality-first (CRF), yuv420p for broad compatibility.
 */
export const webmToMp4: t.WebmToMp4 = async (args) => {
  const { src } = args;
  const out = args.out ?? replaceExt(src, '.mp4');
  const crf = args.crf ?? 18;
  const aac = args.aacKbps ?? 160;

  await Process.run(`
    ffmpeg -y -i "${src}" \
      -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p \
      -crf ${crf} -r:v fps=source -vsync vfr \
      -c:a aac -b:a ${aac}k -ac 2 -movflags +faststart \
      "${out}"
  `);

  return out;
};

/**
 * MP4 (H.264/AAC) → WEBM (VP9/Opus)
 * Small and clean default: CRF single-pass with row-mt threading.
 */
export const mp4ToWebm: t.Mp4ToWebm = async (args) => {
  const { src } = args;
  const out = args.out ?? replaceExt(src, '.webm');
  const crf = args.crf ?? 32;
  const opus = args.opusKbps ?? 96;

  await Process.run(`
    ffmpeg -y -i "${src}" \
      -c:v libvpx-vp9 -b:v 0 -crf ${crf} \
      -row-mt 1 -tile-columns 2 -threads 8 -g 240 -aq-mode 0 -cpu-used 2 \
      -c:a libopus -b:a ${opus}k -ac 2 \
      "${out}"
  `);

  return out;
};
