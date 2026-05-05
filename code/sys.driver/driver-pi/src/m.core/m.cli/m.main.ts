import { type t } from './common.ts';
import { PiCliFmt } from './u.fmt.help.ts';
import { PiArgs } from './u.args.ts';
import { run } from './m.run.ts';
import { resolveCwd } from './u.resolve.cwd.ts';

export const main: t.PiCli.Lib['main'] = async (input = {}) => {
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

  const resolved = await resolveCwd(input.cwd, { gitRoot: parsed.gitRoot });
  if (resolved.kind === 'exit') return { kind: 'exit', input };

  const output = await run({
    cwd: resolved.cwd,
    args: parsed._,
    env: input.env,
    allowAll: input.allowAll === true || parsed.allowAll === true,
    read: input.read,
    write: input.write,
    pkg: input.pkg,
  });

  return {
    kind: 'run',
    input,
    parsed,
    output,
  };
};
