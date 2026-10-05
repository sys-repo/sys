import { Fs, Path, Str, type t } from './common.ts';
import { assertDirectoryIdentity, ensureStagingDirectory } from './u.identity.ts';
import type { PreparedStagingMapping } from './u.prepare.ts';

export type StagingBuildLease = Pick<t.FsRooted.Lease, 'release'>;

// Persistent coordination is source-owned, outside disposable .tmp/dist and namespace parents.
const STATE_DIR = '-dev/deploy';
const BUILD_TARGET = 'build';

/**
 * Exclusively retain every canonical build source across cooperating processes.
 * Each source owns its dev-state root, independently of the caller's Deploy cwd. The private
 * lease target denotes build coordination only; it never grants source-tree mutation authority.
 */
export async function acquireStagingBuildLease(args: {
  mappings: readonly PreparedStagingMapping[];
  signal: AbortSignal;
}): Promise<StagingBuildLease | undefined> {
  const sources = buildSources(args.mappings);
  if (sources.length === 0) return undefined;

  const leases: t.FsRooted.Lease[] = [];
  try {
    for (const source of sources) {
      await assertDirectoryIdentity(source, 'Deploy staging build source', args.signal);
      const state = await ensureStagingDirectory({
        root: source,
        path: Path.join(source.path, STATE_DIR),
        label: 'Deploy build coordination directory',
        signal: args.signal,
      });
      const rooted = await Fs.Capability.Rooted.create({
        root: state.path,
        create: false,
        until: args.signal,
      });
      if (rooted.path !== state.path) {
        throw new Error(`Deploy build coordination directory is not canonical: ${state.path}`);
      }
      await assertDirectoryIdentity(state, 'Deploy build coordination directory', args.signal);

      const admission = await rooted.Target.admit(
        [{ kind: 'directory', path: BUILD_TARGET }],
        { until: args.signal },
      );
      const acquired = await rooted.Lease.acquire(admission.targets, {
        mode: 'exclusive',
        wait: false,
        until: args.signal,
      });
      if (acquired.kind === 'busy') {
        throw new Error(
          `Deploy staging build source is already owned by another operation: ${source.path}`,
        );
      }
      leases.push(acquired.lease);
      await assertDirectoryIdentity(source, 'Deploy staging build source', args.signal);
      await assertDirectoryIdentity(state, 'Deploy build coordination directory', args.signal);
    }
  } catch (error) {
    await releaseAfterAcquisitionFailure(leases, error);
  }

  return Object.freeze({ release: () => releaseLeases(leases) });
}

/** Release nested staging ownership before its outer build-source ownership. */
export function combineStagingLeases(
  staging: Pick<t.FsRooted.Lease, 'release'>,
  build: StagingBuildLease | undefined,
): StagingBuildLease {
  if (!build) return staging;
  return Object.freeze({
    async release() {
      const failures: unknown[] = [];
      try {
        await staging.release();
      } catch (error) {
        failures.push(error);
      }
      try {
        await build.release();
      } catch (error) {
        failures.push(error);
      }
      throwReleaseFailures(failures, 'Deploy staging ownership release failed.');
    },
  });
}

/** Helpers: */
function buildSources(
  mappings: readonly PreparedStagingMapping[],
): readonly t.DeployTool.Staging.DirectoryIdentity[] {
  const sources = new Map<string, t.DeployTool.Staging.DirectoryIdentity>();
  for (const mapping of mappings) {
    if (mapping.mode === 'build+copy') sources.set(mapping.source, mapping.sourceIdentity);
  }
  const compare = Str.Compare.codeUnit();
  return [...sources.values()].toSorted((a, b) => compare(a.path, b.path));
}

async function releaseAfterAcquisitionFailure(
  leases: readonly t.FsRooted.Lease[],
  acquisitionError: unknown,
): Promise<never> {
  try {
    await releaseLeases(leases);
  } catch (releaseError) {
    throw new AggregateError(
      [acquisitionError, releaseError],
      'Deploy staging build-source acquisition failed and partial ownership release also failed.',
      { cause: acquisitionError },
    );
  }
  throw acquisitionError;
}

async function releaseLeases(leases: readonly t.FsRooted.Lease[]): Promise<void> {
  const failures: unknown[] = [];
  for (const lease of leases.toReversed()) {
    try {
      await lease.release();
    } catch (error) {
      failures.push(error);
    }
  }
  throwReleaseFailures(failures, 'Deploy staging build-source ownership release failed.');
}

function throwReleaseFailures(failures: readonly unknown[], message: string): void {
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, message, { cause: failures[0] });
}
