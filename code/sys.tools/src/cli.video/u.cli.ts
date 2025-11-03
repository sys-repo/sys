import { type t, Args, Cli, Fs } from './common.ts';
import { selectAndConvert } from './u.cli.convert.ts';
import { selectAndProbe } from './u.cli.probe.ts';
import { Ffmpeg } from './u.ffmpeg.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.VideoCliLib['cli'] = async (opts = {}) => {
  const toolname = 'Video Tools';
  const dir = opts.dir ?? Fs.cwd('terminal');
  const args = Args.parse<t.VideoCliArgs>(opts.argv, { alias: { h: 'help' } });
  if (!(await Ffmpeg.getVersion()).is.installed) return;
  if (args.help) return void console.info(await Fmt.help(toolname));

  console.info();
  console.info(await Fmt.header(toolname, dir));
  console.info();

  await run(dir);

  console.info();
  console.info(Fmt.signoff(toolname));
};

/**
 * Helpers:
 */
async function run(dir: t.StringDir) {
  const options: { name: string; value: t.VideoCommand }[] = [
    { name: 'convert .webm → .mp4', value: 'webm-to-mp4' },
    { name: 'convert .mp4  → .webm', value: 'mp4-to-webm' },
    { name: 'info (probe file)', value: 'probe-file' },
  ];

  const command = (await Cli.Prompt.Select.prompt({
    message: 'Video Tools:',
    options,
  })) as t.VideoCommand;

  switch (command) {
    case 'webm-to-mp4':
    case 'mp4-to-webm':
      await selectAndConvert({ dir, command });
      break;

    case 'probe-file':
      await selectAndProbe({ dir });
      break;

    default:
      break;
  }
}
