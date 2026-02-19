import * as DotEnv from '@std/dotenv';
import { type t, StdPath } from './common.ts';

export const load: t.EnvLib['load'] = async (options = {}) => {
  const cwd = options.cwd ?? (Deno.cwd() as t.StringDir);
  const search = options.search ?? 'cwd';

  const envPath =
    search === 'upward'
      ? await resolveDotEnvPath(cwd)
      : (StdPath.join(cwd, '.env') as t.StringFile);

  const dotenv = envPath ? await DotEnv.load({ envPath }) : {};
  const api: t.Env = {
    get(key) {
      return dotenv[key] || Deno.env.get(key) || '';
    },
  };
  return api;
};

const resolveDotEnvPath = async (startDir: t.StringDir): Promise<t.StringFile | undefined> => {
  let dir: t.StringDir = startDir;

  while (true) {
    const path = StdPath.join(dir, '.env') as t.StringFile;
    if (await fileExists(path)) return path;

    const parent = StdPath.dirname(dir) as t.StringDir;
    if (parent === dir) return;
    dir = parent;
  }
};

const fileExists = async (path: t.StringFile): Promise<boolean> => {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile;
  } catch {
    return false;
  }
};
