import { type t, Jsr, Npm } from './common.ts';

export type UpgradeSession = {
  readonly versions: Map<
    string,
    Promise<t.Registry.Jsr.Fetch.PkgVersionsResponse | t.Registry.Npm.Fetch.PkgVersionsResponse>
  >;
  readonly info: Map<
    string,
    Promise<t.Registry.Jsr.Fetch.PkgInfoResponse | t.Registry.Npm.Fetch.PkgInfoResponse>
  >;
};

export function createSession(): UpgradeSession {
  return {
    versions: new Map(),
    info: new Map(),
  };
}

export const Session = {
  versions(
    session: UpgradeSession,
    entry: t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'jsr' | 'npm' } },
  ) {
    const key = `${entry.module.registry}:${entry.module.name}`;
    const current = session.versions.get(key);
    if (current) return current;

    const next = wrangle.versions(entry);
    session.versions.set(key, next);
    return next;
  },

  npmInfo(
    session: UpgradeSession,
    entry: t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'npm' } },
    version: t.StringSemver,
  ) {
    const key = `npm:${entry.module.name}@${version}`;
    const current = session.info.get(key);
    if (current) return current as Promise<t.Registry.Npm.Fetch.PkgInfoResponse>;

    const next = Npm.Fetch.Pkg.info(entry.module.name, version);
    session.info.set(key, next);
    return next;
  },

  jsrInfo(
    session: UpgradeSession,
    entry: t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'jsr' } },
    version: t.StringSemver,
  ) {
    const key = `jsr:${entry.module.name}@${version}`;
    const current = session.info.get(key);
    if (current) return current as Promise<t.Registry.Jsr.Fetch.PkgInfoResponse>;

    const next = Jsr.Fetch.Pkg.info(entry.module.name, version);
    session.info.set(key, next);
    return next;
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  versions(
    entry: t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'jsr' | 'npm' } },
  ) {
    if (entry.module.registry === 'jsr') return Jsr.Fetch.Pkg.versions(entry.module.name);
    return Npm.Fetch.Pkg.versions(entry.module.name);
  },
} as const;
