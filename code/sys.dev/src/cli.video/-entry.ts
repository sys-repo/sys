import { type t, c, Cli, Fs } from './common.ts';
import { mp4ToWebm, webmToMp4 } from './u.convert.ts';
import { selectSourceFile } from './u.file.select.ts';

const OPTIONS: { name: string; value: t.Conversion }[] = [
  { name: 'convert .webm → .mp4', value: 'webm-to-mp4' },
  { name: 'convert .mp4 → .webm', value: 'mp4-to-webm' },
];

/**
 * Ask the user what conversion they want to perform, then run it.
 */
export async function entry(opts: { dir?: t.StringDir } = {}) {
  const dir = opts.dir ?? Fs.cwd('terminal');
  console.info(c.gray(await Fs.Fmt.treeFromDir(dir, { indent: 1 })));
  console.info();

  const chosen = await Cli.Prompt.Select.prompt<t.Conversion>({
    message: 'Choose conversion type:',
    options: OPTIONS,
  });

  const conversion = chosen as t.Conversion;
  const src = await selectSourceFile({ dir, conversion });
  if (!src) return; // nothing to do (no candidates or user aborted)

  try {
    const out = await convertOne({ conversion, src });
    console.info(`\nDone → ${Fs.trimCwd(out, { prefix: true })}\n`);
  } catch (err) {
    console.error('\nConversion failed:', err instanceof Error ? err.message : err, '\n');
  }
}

/**
 * Helpers:
 */
async function convertOne(args: { conversion: t.Conversion; src: string }) {
  const { conversion, src } = args;

  switch (conversion) {
    case 'webm-to-mp4': {
      console.info(`\nConverting .webm → .mp4\n${Fs.trimCwd(src, { prefix: true })}`);
      return await webmToMp4({ src });
    }
    case 'mp4-to-webm': {
      console.info(`\nConverting .mp4 → .webm\n${Fs.trimCwd(src, { prefix: true })}`);
      return await mp4ToWebm({ src });
    }
  }
}
