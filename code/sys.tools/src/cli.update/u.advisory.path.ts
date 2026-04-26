import { Path, type t } from './common.ts';

type EnvLike = Pick<typeof Deno.env, 'get'>;

export function resolveUpdateAdvisoryPath(env: EnvLike = Deno.env): t.StringPath | undefined {
  const xdg = env.get('XDG_CACHE_HOME')?.trim();
  if (xdg) return Path.join(xdg, 'sys', 'tools', 'update-advisory.json');

  const home = env.get('HOME')?.trim();
  if (home) return Path.join(home, '.cache', 'sys', 'tools', 'update-advisory.json');

  return undefined;
}
