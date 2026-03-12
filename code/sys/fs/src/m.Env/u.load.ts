import * as DotEnv from '@std/dotenv';
import { type t, StdPath } from './common.ts';

export const load: t.EnvLib['load'] = async (options = {}) => {
  const cwd = options.cwd ?? (Deno.cwd() as t.StringDir);
  const search = options.search ?? 'cwd';

  const envPaths =
    search === 'upward'
      ? await resolveDotEnvPaths(cwd)
      : [StdPath.join(cwd, '.env') as t.StringFile];
  const dotenv = await loadDotEnvFiles(envPaths);
  const api: t.Env = {
    get(key) {
      return Object.prototype.hasOwnProperty.call(dotenv, key) ? dotenv[key] : Deno.env.get(key) || '';
    },
  };
  return api;
};

const resolveDotEnvPaths = async (startDir: t.StringDir): Promise<readonly t.StringFile[]> => {
  const paths: t.StringFile[] = [];
  let dir: t.StringDir = startDir;

  while (true) {
    const path = StdPath.join(dir, '.env') as t.StringFile;
    if (await fileExists(path)) paths.unshift(path);

    const parent = StdPath.dirname(dir) as t.StringDir;
    if (parent === dir) return paths;
    dir = parent;
  }
};

const loadDotEnvFiles = async (paths: readonly t.StringFile[]): Promise<Record<string, string>> => {
  const merged: Record<string, string> = {};

  for (const envPath of paths) {
    const current = await DotEnv.load({ envPath });
    Object.assign(merged, current);
  }

  return merged;
};

const fileExists = async (path: t.StringFile): Promise<boolean> => {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile;
  } catch {
    return false;
  }
};
