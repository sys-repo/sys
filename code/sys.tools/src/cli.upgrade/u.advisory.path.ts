import { Path, pkg, type t } from './common.ts';

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
  return Path.join(dir, packageCacheDirName(), UPGRADE_ADVISORY_FILE);
}

function packageCacheDirName() {
  return pkg.name.split('/').filter(Boolean).join('.');
}
