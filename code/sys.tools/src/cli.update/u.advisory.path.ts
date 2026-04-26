import { Path, pkg, type t } from './common.ts';
import { YamlConfig } from '@sys/yaml/cli';

type EnvLike = Pick<typeof Deno.env, 'get'>;

const UPDATE_ADVISORY_FILE = 'advisory.json' as const;

export function resolveUpdateAdvisoryPath(env: EnvLike = Deno.env): t.StringPath | undefined {
  const xdg = env.get('XDG_CACHE_HOME')?.trim();
  if (xdg) return toUpdateAdvisoryPath(xdg as t.StringDir);

  const home = env.get('HOME')?.trim();
  if (home) return toUpdateAdvisoryPath(Path.join(home, '.cache'));

  return undefined;
}

function toUpdateAdvisoryPath(dir: t.StringDir): t.StringPath {
  const root = YamlConfig.File.fromPkg(dir, pkg).dir.path;
  return Path.join(root, UPDATE_ADVISORY_FILE);
}
