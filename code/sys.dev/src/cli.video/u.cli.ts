import { type t, c, Cli, Fs, pkg } from './common.ts';
import { mp4ToWebm, webmToMp4 } from './u.convert.ts';
import { selectSourceFiles } from './u.file.select.ts';

const OPTIONS: { name: string; value: t.Conversion }[] = [
  { name: 'convert .webm → .mp4', value: 'webm-to-mp4' },
  { name: 'convert .mp4 → .webm', value: 'mp4-to-webm' },
];

export const cli: t.VideoToolsLib['cli'] = async (opts = {}) => {
  const dir = opts.dir ?? Fs.cwd('terminal');

  console.info();
  console.info(c.gray(`${c.green('Video Tools')} v${pkg.version}`));
  console.info(c.gray(await Fs.Fmt.treeFromDir(dir, { indent: 2 })));
  console.info();

  const chosen = await Cli.Prompt.Select.prompt<t.Conversion>({
    message: 'Choose conversion type:',
    options: OPTIONS,
  });

  const conversion = chosen as t.Conversion;

  // Multi-select:
  const sources = await selectSourceFiles({ dir, conversion });
  if (sources.length === 0) return;

  const results: { src: string; out?: string; ok: boolean; err?: string }[] = [];
  for (const src of sources) {
    const prettySrc = Fs.trimCwd(src, { prefix: true });
    const destLabel = conversion === 'webm-to-mp4' ? c.cyan('.mp4') : c.cyan('.webm');
    const spin = Cli.spinner(c.gray(`Converting ${prettySrc} → ${destLabel}`));

    try {
      const out = await convertOne({ conversion, src });
      const prettyOut = Fs.trimCwd(out, { prefix: true });

      // Stop spinner quietly and print our own single line (no trailing newline):
      spin.stop();
      console.info(c.gray(`${c.green('✔ Saved')} → ${prettyOut}`));

      results.push({ ok: true, src, out });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      spin.stop();
      console.error(`${c.red('✖')} ${prettySrc} → ${msg}`);
      results.push({ ok: false, src, err: msg });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.length - okCount;
  console.info();
  console.info(
    failCount
      ? `${c.green(String(okCount))} succeeded, ${c.red(String(failCount))} failed`
      : `${c.green(String(okCount))} succeeded`,
  );
};

async function convertOne(args: { conversion: t.Conversion; src: string }) {
  const { conversion, src } = args;

  switch (conversion) {
    /**
     * WebM (VP9) → MP4 (H.264)
     * Strategy: keep the *intermediate MP4* high quality to minimize generational loss,
     * since the MP4 is just a hop before we (often) go back to WebM.
     * - Lower CRF = higher quality (bigger file). 14 is a “near-visually-lossless” tier.
     * - Slightly higher AAC bitrate to avoid audible artifacts on the round-trip.
     */
    case 'webm-to-mp4':
      return webmToMp4({ src, crf: 14, aacKbps: 192 });

    /**
     * MP4 (H.264) → WebM (VP9)
     * Strategy: make the *final WebM* the size-focused encode while keeping quality solid.
     * - CRF 30 is a good “small but safe” default; lower to 28 for more quality,
     *   raise to 32 for smaller files.
     * - Opus 128 kbps is a clean default; drop to 96 kbps if you need extra shrink.
     */
    case 'mp4-to-webm':
      return mp4ToWebm({ src, crf: 30, opusKbps: 128 });
  }
}
