import { type t, Cli, Fs } from './common.ts';
import { selectSourceFile } from './u.file.select.ts';

const OPTIONS: { name: string; value: t.Conversion }[] = [
  { name: 'convert .webm → .mp4', value: 'webm-to-mp4' },
  { name: 'convert .mp4 → .webm', value: 'mp4-to-webm' },
];

/**
 * Ask the user what conversion they want to perform.
 */
export async function entry(opts: { dir?: t.StringDir } = {}) {
  const dir = opts.dir ?? Fs.cwd('terminal');

  const conversion = await Cli.Prompt.Select.prompt<t.Conversion>({
    message: 'Choose conversion type:',
    options: OPTIONS,
  });

  switch (conversion) {
    case 'webm-to-mp4':
      console.log('Converting .webm → .mp4 …');
      // TODO: convert.webmToMp4()
      const m0 = await selectSourceFile({ dir, conversion });
      console.log('m', m0);
      break;

    case 'mp4-to-webm':
      console.log('Converting .mp4 → .webm …');
      const m1 = await selectSourceFile({ dir, conversion });
      console.log('m1', m1);

      // TODO: convert.mp4ToWebm()
      break;
  }
}
