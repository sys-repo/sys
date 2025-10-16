import { type t, c, Cli, Fs } from './common.ts';
import { mp4ToWebm, webmToMp4 } from './u.convert.ts';
import { selectSourceFile } from './u.file.select.ts';

const OPTIONS: { name: string; value: t.Conversion }[] = [
  { name: 'convert .webm → .mp4', value: 'webm-to-mp4' },
  { name: 'convert .mp4 → .webm', value: 'mp4-to-webm' },
];

export async function entry(opts: { dir?: t.StringDir } = {}) {
  const dir = opts.dir ?? Fs.cwd('terminal');
  console.info(c.gray(await Fs.Fmt.treeFromDir(dir, { indent: 2 })));
  console.info();

  const chosen = await Cli.Prompt.Select.prompt<t.Conversion>({
    message: 'Choose conversion type:',
    options: OPTIONS,
  });

  const conversion = chosen as t.Conversion;
  const src = await selectSourceFile({ dir, conversion });
  if (!src) return;

  const prettySrc = Fs.trimCwd(src, { prefix: true });

  // Spinner starts here:
  const label =
    conversion === 'webm-to-mp4'
      ? `Converting ${prettySrc} → ${c.cyan('.mp4')}`
      : `Converting ${prettySrc} → ${c.cyan('.webm')}`;
  const spin = Cli.spinner(c.gray(label));

  try {
    const out = await convertOne({ conversion, src });
    const prettyOut = Fs.trimCwd(out, { prefix: true });
    spin.succeed(c.gray(`${c.green('Saved')} → ${prettyOut}`));
    console.info(); // spacing
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    spin.fail(`Conversion failed: ${msg}`);
    console.info(); // spacing
  }
}

async function convertOne(args: { conversion: t.Conversion; src: string }) {
  const { conversion, src } = args;
  switch (conversion) {
    case 'webm-to-mp4':
      return webmToMp4({ src });
    case 'mp4-to-webm':
      return mp4ToWebm({ src });
  }
}
