import { type t, c, Cli, Fs } from './common.ts';
import { selectSourceFiles } from './u.convert.select.ts';
import { mp4ToWebm, webmToMp4 } from './u.convert.ts';

type TResult = { src: string; out?: string; ok: boolean; err?: string };

export async function selectAndConvert(args: { dir: t.StringDir; command: t.Conversion }) {
  const { dir, command } = args;
  const sources = await selectSourceFiles({ dir, command });
  if (sources.length === 0) return;

  const results: TResult[] = [];
  for (const src of sources) {
    const prettySrc = Fs.trimCwd(src, { prefix: true });
    const destLabel = command === 'webm-to-mp4' ? c.cyan('.mp4') : c.cyan('.webm');
    const spin = Cli.spinner(c.gray(`Converting ${prettySrc} → ${destLabel}`));

    try {
      const out = await convertOne({ command: command, src });
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
}

async function convertOne(args: { command: t.Conversion; src: string }) {
  const { command, src } = args;
  switch (command) {
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
