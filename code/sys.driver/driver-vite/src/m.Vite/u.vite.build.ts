import { Cmd, Fs, type t } from './common.ts';
import { Log, Wrangle } from './u.ts';

/**
 * Run the <vite:build> command.
 */
export const build: t.ViteLib['build'] = async (input) => {
  const { silent = true, pkg } = input;
  const { env, cmd, args, paths } = Wrangle.command(input, 'build');
  const output = await Cmd.invoke({ args, env, silent });
  const size = await Fs.Size.dir(paths.outDir);
  const bytes = size.total.bytes;
  const ok = output.success;
  const res: t.ViteBuildResponse = {
    ok,
    cmd,
    output,
    paths,
    toString(options = {}) {
      const { pad } = options;
      const stdio = output.toString();
      return Log.Build.toString({ ok, stdio, paths, pad, pkg, bytes });
    },
  };
  return res;
};
