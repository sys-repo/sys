import { Jsr, Npm, type t } from './common.ts';

type JsrPackageRegistry = Pick<typeof Jsr.Fetch.Pkg, 'versions' | 'info'>;
type NpmPackageRegistry = Pick<typeof Npm.Fetch.Pkg, 'versions' | 'info'>;

export type UpgradeRegistryDependencies = {
  readonly jsr: JsrPackageRegistry;
  readonly npm: NpmPackageRegistry;
};

export type UpgradeSession = {
  readonly registry: UpgradeRegistryDependencies;
  readonly versions: Map<
    string,
    Promise<t.Registry.Jsr.Fetch.Pkg.VersionsResponse | t.Registry.Npm.Fetch.Pkg.VersionsResponse>
  >;
  readonly info: Map<
    string,
    Promise<t.Registry.Jsr.Fetch.Pkg.InfoResponse | t.Registry.Npm.Fetch.Pkg.InfoResponse>
  >;
};

const DEFAULT_REGISTRY: UpgradeRegistryDependencies = {
  jsr: Jsr.Fetch.Pkg,
  npm: Npm.Fetch.Pkg,
};

export function createSession(
  registry: UpgradeRegistryDependencies = DEFAULT_REGISTRY,
): UpgradeSession {
  return {
    registry,
    versions: new Map(),
    info: new Map(),
  };
}

export const Session = Object.freeze(
  {
    versions(
      session: UpgradeSession,
      entry: t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'jsr' | 'npm' } },
    ) {
      const key = `${entry.module.registry}:${entry.module.name}`;
      const current = session.versions.get(key);
      if (current) return current;

      const next = wrangle.versions(session, entry);
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
      if (current) return current as Promise<t.Registry.Npm.Fetch.Pkg.InfoResponse>;

      const next = session.registry.npm.info(entry.module.name, version);
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
      if (current) return current as Promise<t.Registry.Jsr.Fetch.Pkg.InfoResponse>;

      const next = session.registry.jsr.info(entry.module.name, version, { fresh: true });
      session.info.set(key, next);
      return next;
    },
  } as const,
);

/**
 * Helpers:
 */
const wrangle = {
  versions(
    session: UpgradeSession,
    entry: t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'jsr' | 'npm' } },
  ) {
    if (entry.module.registry === 'jsr') {
      return session.registry.jsr.versions(entry.module.name);
    }
    return session.registry.npm.versions(entry.module.name);
  },
} as const;
