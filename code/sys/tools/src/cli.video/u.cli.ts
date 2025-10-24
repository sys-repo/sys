import { type t, c, Cli, Fs, pkg } from './common.ts';
import { selectAndConvert } from './u.cli.convert.ts';
import { checkFfmpegInstalled } from './u.ffmpeg.ts';

const OPTIONS: { name: string; value: t.Command }[] = [
  { name: 'convert .webm → .mp4', value: 'webm-to-mp4' },
  { name: 'convert .mp4 → .webm', value: 'mp4-to-webm' },
  // { name: 'probe (info)', value: 'probe' },
];

export const cli: t.VideoToolsLib['cli'] = async (opts = {}) => {
  const dir = opts.dir ?? Fs.cwd('terminal');
  console.info();
  console.info(c.gray(`${c.green('Video Tools')} v${pkg.version}`));
  console.info(c.gray(await Fs.Fmt.treeFromDir(dir, { indent: 2 })));
  console.info();

  if (!(await checkFfmpegInstalled())) return;

  const command = (await Cli.Prompt.Select.prompt({
    message: 'Command:',
    options: OPTIONS,
  })) as t.Command;

  switch (command) {
    case 'webm-to-mp4':
    case 'mp4-to-webm':
      await selectAndConvert({ dir, command });
      break;

    default:
      break;
  }
};
