import { Fs, type t } from './common.ts';
import { PiCliFmt } from './u.fmt.help.ts';
import { PiArgs } from './u.args.ts';
import { run } from './m.run.ts';

export const main: t.PiCli.Lib['main'] = async (input = {}) => {
  const cwd = input.cwd ?? Fs.cwd('terminal');
  const parsed = PiArgs.parse(input.argv ?? []);

  if (parsed.help) {
    const text = PiCliFmt.help();
    console.info(text);
    return {
      kind: 'help',
      input,
      text,
    };
  }

  const output = await run({
    cwd,
    args: parsed._,
    env: input.env,
    read: input.read,
    pkg: input.pkg,
  });

  return {
    kind: 'run',
    input,
    parsed,
    output,
  };
};
