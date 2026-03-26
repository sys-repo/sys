import { type t, Deps, Err, Is, Semver } from './common.ts';
import { createSession, Session, type UpgradeSession } from './u.session.ts';

export const collect: t.WorkspaceUpgrade.Lib['collect'] = async (input, options) => {
  return await collectWithSession(input, options, createSession());
};

/**
 * Internal session-aware collection helper for multi-phase upgrade orchestration.
 */
export async function collectWithSession(
  input: t.WorkspaceUpgrade.Input,
  options: t.WorkspaceUpgrade.Options | undefined,
  session: UpgradeSession,
): Promise<t.WorkspaceUpgrade.CollectResult> {
  const resolved = wrangle.options(options);
  const manifest = await Deps.from(input.deps);

  if (!manifest.data) {
    return {
      input,
      options: resolved,
      totals: { dependencies: 0, collected: 0, skipped: 0, failed: 1 },
      candidates: [],
      uncollected: [
        {
          entry: wrangle.missingEntry(input.deps),
          reason: {
            code: 'deps:load',
            message: manifest.error?.message ?? 'Dependency manifest data could not be retrieved',
          },
        },
      ],
    };
  }

  const candidates: t.WorkspaceUpgrade.Candidate[] = [];
  const uncollected: t.WorkspaceUpgrade.Uncollected[] = [];

  for (const entry of manifest.data.entries) {
    const current = wrangle.current(entry.module.version);
    if (!current) {
      uncollected.push({
        entry,
        reason: { code: 'version:missing-current', message: 'Dependency version is not pinned' },
      });
      continue;
    }

    if (!wrangle.supports(resolved.registries, entry.module.registry)) {
      uncollected.push({
        entry,
        reason: {
          code: 'registry:unsupported',
          message: `Unsupported registry: ${entry.module.registry || '(none)'}`,
        },
      });
      continue;
    }

    resolved.progress?.({ kind: entry.module.registry === 'jsr' ? 'registry:jsr' : 'registry:npm' });
    const versions = await Session.versions(session, wrangle.registryEntry(entry));
    if (!versions.ok || !versions.data) {
      uncollected.push({
        entry,
        reason: {
          code: 'registry:fetch',
          message: versions.error?.message ?? `${entry.module.registry} registry lookup failed`,
        },
      });
      continue;
    }

    const available = wrangle.available(entry.module.registry, versions.data.versions, resolved.prerelease);
    candidates.push({
      entry,
      registry: entry.module.registry as t.EsmRegistry,
      current,
      latest: available[0],
      available,
    });
  }

  return {
    input,
    options: resolved,
    totals: {
      dependencies: manifest.data.entries.length,
      collected: candidates.length,
      skipped: uncollected.filter((item) => item.reason.code !== 'registry:fetch').length,
      failed: uncollected.filter((item) => item.reason.code === 'registry:fetch').length,
    },
    candidates,
    uncollected,
  };
}

const wrangle = {
  options(options?: t.WorkspaceUpgrade.Options): t.WorkspaceUpgrade.ResolvedOptions {
    return {
      policy: options?.policy ?? { mode: 'minor' },
      prerelease: options?.prerelease ?? false,
      registries: options?.registries ?? ['jsr', 'npm'],
      log: options?.log ?? false,
      progress: options?.progress,
    };
  },

  current(version: t.StringSemver): t.StringSemver | undefined {
    const coerced = Semver.coerce(version).version;
    const clean = Semver.Prefix.strip(coerced);
    return clean ? (clean as t.StringSemver) : undefined;
  },

  supports(registries: readonly t.EsmRegistry[], registry: string): registry is t.EsmRegistry {
    return (registry === 'jsr' || registry === 'npm') && registries.includes(registry);
  },

  registryEntry(
    entry: t.EsmDeps.Entry,
  ): t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'jsr' | 'npm' } } {
    return entry as t.EsmDeps.Entry & {
      module: t.EsmDeps.Entry['module'] & { registry: 'jsr' | 'npm' };
    };
  },

  available(
    registry: string,
    versions: Record<string, unknown>,
    prerelease: boolean,
  ): readonly t.StringSemver[] {
    const keys = Object.entries(versions ?? {})
      .filter(([_, meta]) => !wrangle.excluded(registry, meta))
      .map(([version]) => version);
    const clean = keys
      .map((version) => wrangle.current(version))
      .filter((version): version is t.StringSemver => Is.str(version) && version.length > 0)
      .filter((version) => prerelease || wrangle.released(version));
    return Semver.sort([...new Set(clean)], { order: 'desc' });
  },

  excluded(registry: string, meta: unknown): boolean {
    if (registry !== 'npm') return false;
    if (!meta || typeof meta !== 'object') return false;
    const deprecated = Reflect.get(meta, 'deprecated');
    return Is.str(deprecated) && deprecated.length > 0;
  },

  released(version: t.StringSemver): boolean {
    const parsed = Semver.parse(version);
    const prerelease = parsed.version.prerelease ?? [];
    return !parsed.error && prerelease.length === 0;
  },

  missingEntry(path: string): t.EsmDeps.Entry {
    return {
      module: {
        input: path,
        registry: '',
        name: path,
        version: '',
        subpath: '',
        error: Err.std('Dependency manifest data could not be retrieved'),
        toString: () => path,
      },
      target: ['deno.json'],
    };
  },
} as const;
