import { Fs, type t } from './common.ts';
import { run as runCli } from '../m.cli/m.run.ts';
import { menu } from './u.menu.ts';
import { ProfileArgs } from './u.args.ts';
import { ProfilesFmt } from './u.fmt.help.ts';
import { ProfilesFs } from './u.fs.ts';
import { resolveRun } from './u.resolve.run.ts';

export const main: t.PiCliProfiles.Lib['main'] = async (input = {}) => {
  const cwd = input.cwd ?? Fs.cwd('terminal');
  const parsed = ProfileArgs.parse(input.argv);

  if (parsed.help) {
    const text = ProfilesFmt.help();
    console.info(text);
    return { kind: 'help', input, text };
  }

  if (parsed.config && parsed.profile) {
    throw new Error('--config and --profile are mutually exclusive; pass exactly one.');
  }

  const picked = parsed.config
    ? {
      kind: 'selected' as const,
      config: parsed.config as t.StringPath,
    }
    : parsed.profile
      ? {
        kind: 'selected' as const,
        config: ProfilesFs.fileOf(parsed.profile) as t.StringPath,
      }
      : await menu({ cwd });

  if (picked.kind === 'exit') return { kind: 'exit', input };

  const resolved = await resolveRun({
    cwd,
    config: picked.config,
    args: parsed._,
    env: input.env,
    read: input.read,
    write: input.write,
    pkg: input.pkg,
  });
  const output = await runCli(resolved);

  return { kind: 'run', input, parsed, output };
};
