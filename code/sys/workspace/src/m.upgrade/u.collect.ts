import { Arr, Deps, Err, Is, Num, Obj, Semver, type t, Time } from './common.ts';
import { createSession, Session, type UpgradeSession } from './u.session.ts';
import { Standdown } from './u.standdown.ts';

type RegistryProgressState = {
  readonly total: t.WorkspaceUpgrade.RegistryProgressCounts;
  current: t.WorkspaceUpgrade.RegistryProgressCounts;
  completed: number;
  readonly dependencies: number;
};

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
  const progress = wrangle.registryProgress(manifest.data.entries, resolved.registries);

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

    wrangle.bumpProgress(progress, entry.module.registry);
    resolved.progress?.(wrangle.progressEvent(progress, entry.module.registry));
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

    const available = wrangle.available(
      entry.module.registry,
      versions.data.latest,
      versions.data.versions,
      resolved.prerelease,
    );
    const registry = entry.module.registry as t.EsmRegistry;
    const standdown = Standdown.evaluate({
      registry,
      current,
      available,
      versions: versions.data.versions,
      minimumDependencyAge: resolved.minimumDependencyAge,
      evaluatedAt: resolved.evaluatedAt,
    });

    candidates.push({
      entry,
      registry,
      current,
      latest: available[0],
      available,
      eligible: standdown.eligible,
      versions: standdown.versions,
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
    packageJson: manifest.data.packageJson,
  };
}

const wrangle = {
  options(options?: t.WorkspaceUpgrade.Options): t.WorkspaceUpgrade.ResolvedOptions {
    return {
      policy: options?.policy ?? { mode: 'minor' },
      prerelease: options?.prerelease ?? false,
      registries: options?.registries ?? ['jsr', 'npm'],
      minimumDependencyAge: wrangle.minimumDependencyAge(options?.minimumDependencyAge),
      evaluatedAt: wrangle.evaluatedAt(options?.evaluatedAt),
      log: options?.log ?? false,
      progress: options?.progress,
    };
  },

  minimumDependencyAge(input?: t.Msecs): t.Msecs {
    if (input === undefined) return 0;
    if (!Num.Is.finite(input) || input < 0) {
      throw Err.std(`Invalid minimumDependencyAge: ${input}`);
    }
    return input;
  },

  evaluatedAt(input?: t.UnixTimestamp): t.UnixTimestamp {
    if (input === undefined) return Time.now.timestamp;
    if (!Num.Is.finite(input) || input < 0) {
      throw Err.std(`Invalid evaluatedAt timestamp: ${input}`);
    }
    return input;
  },

  current(version: t.StringSemver): t.StringSemver | undefined {
    const coerced = Semver.coerce(version).version;
    const clean = Semver.Prefix.strip(coerced);
    return clean ? (clean as t.StringSemver) : undefined;
  },

  supports(registries: readonly t.EsmRegistry[], registry: string): registry is t.EsmRegistry {
    return (registry === 'jsr' || registry === 'npm') && registries.includes(registry);
  },

  registryProgress(
    entries: readonly t.EsmDeps.Entry[],
    registries: readonly t.EsmRegistry[],
  ): RegistryProgressState {
    const total = entries.reduce<t.WorkspaceUpgrade.RegistryProgressCounts>(
      (acc, entry) => {
        if (!wrangle.current(entry.module.version)) return acc;
        if (!wrangle.supports(registries, entry.module.registry)) return acc;
        return {
          ...acc,
          [entry.module.registry]: acc[entry.module.registry] + 1,
        };
      },
      { jsr: 0, npm: 0 },
    );

    return {
      total,
      current: { jsr: 0, npm: 0 },
      completed: 0,
      dependencies: total.jsr + total.npm,
    };
  },

  bumpProgress(
    progress: RegistryProgressState,
    registry: t.EsmRegistry,
  ): void {
    progress.current = {
      ...progress.current,
      [registry]: progress.current[registry] + 1,
    };
    progress.completed += 1;
  },

  progressEvent(
    progress: RegistryProgressState,
    registry: t.EsmRegistry,
  ): t.WorkspaceUpgrade.RegistryProgress {
    return {
      kind: 'registry',
      registry,
      current: progress.current,
      total: progress.total,
      completed: progress.completed,
      dependencies: progress.dependencies,
    };
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
    latest: string | undefined,
    versions: Record<string, unknown>,
    prerelease: boolean,
  ): readonly t.StringSemver[] {
    const keys = Obj.entries(versions ?? {})
      .filter(([_, meta]) => !wrangle.excluded(registry, meta))
      .map(([version]) => version);
    const clean = keys
      .map((version) => wrangle.current(version))
      .filter((version): version is t.StringSemver => Is.str(version) && version.length > 0)
      .filter((version) => wrangle.withinLatest(registry, latest, version))
      .filter((version) => prerelease || wrangle.released(version));
    return Semver.sort(Arr.uniq(clean), { order: 'desc' });
  },

  excluded(registry: string, meta: unknown): boolean {
    if (registry !== 'npm') return false;
    if (!Obj.isRecord(meta)) return false;
    const deprecated = meta.deprecated;
    return Is.str(deprecated) && deprecated.length > 0;
  },

  withinLatest(registry: string, latest: string | undefined, version: t.StringSemver): boolean {
    if (registry !== 'npm') return true;
    const cap = latest ? wrangle.current(latest) : undefined;
    if (!cap) return true;
    return Semver.Is.lessOrEqual(version, cap);
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
