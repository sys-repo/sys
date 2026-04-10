import { Fs, type t } from './common.ts';
import { run } from './m.run.ts';
import { menu } from './u.menu.ts';
import { ProfileArgs } from './u.args.ts';
import { ProfilesFmt } from './u.fmt.help.ts';

export const main: t.PiCliProfiles.Lib['main'] = async (input = {}) => {
  const cwd = input.cwd ?? Fs.cwd('terminal');
  const parsed = ProfileArgs.parse(input.argv);

  if (parsed.help) {
    const text = ProfilesFmt.help();
    console.info(text);
    return { kind: 'help', input, text };
  }

  const picked = parsed.config
    ? {
      kind: 'selected' as const,
      config: parsed.config as t.StringPath,
    }
    : await menu({ cwd });

  if (picked.kind === 'exit') return { kind: 'exit', input };

  const output = await run({
    cwd,
    config: picked.config,
    args: parsed._,
    env: input.env,
    read: input.read,
    pkg: input.pkg,
  });

  return { kind: 'run', input, parsed, output };
};
