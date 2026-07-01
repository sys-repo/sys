import { Path, pkg, type t } from './common.ts';
import { YamlConfig } from '@sys/yaml/cli';

type EnvLike = { readonly get: (key: string) => string | undefined };

const UPGRADE_ADVISORY_FILE = 'advisory.json' as const;

export function resolveUpgradeAdvisoryPath(env: EnvLike = Deno.env): t.StringPath | undefined {
  const xdg = env.get('XDG_CACHE_HOME')?.trim();
  if (xdg) return toUpgradeAdvisoryPath(xdg as t.StringDir);

  const home = env.get('HOME')?.trim();
  if (home) return toUpgradeAdvisoryPath(Path.join(home, '.cache'));

  return undefined;
}

function toUpgradeAdvisoryPath(dir: t.StringDir): t.StringPath {
  const root = YamlConfig.File.fromPkg(dir, pkg).dir.path;
  return Path.join(root, UPGRADE_ADVISORY_FILE);
}
