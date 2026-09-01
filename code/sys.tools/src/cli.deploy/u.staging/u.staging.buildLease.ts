import { Fs, Path, Str, type t } from '../common.ts';
import type { PreparedStagingMapping } from './u.staging.prepare.ts';

export type StagingBuildLease = Pick<t.FsRooted.Lease, 'release'>;

type LeaseGroup = {
  readonly parent: t.StringAbsoluteDir;
  readonly sources: readonly t.StringAbsoluteDir[];
};

/**
 * Exclusively retain every canonical build source across cooperating processes.
 * Each source is admitted beneath its canonical parent so callers with different Deploy cwd roots
 * still converge on the same stable Rooted lock identity.
 */
export async function acquireStagingBuildLease(args: {
  mappings: readonly PreparedStagingMapping[];
  signal: AbortSignal;
}): Promise<StagingBuildLease | undefined> {
  const groups = buildLeaseGroups(args.mappings);
  if (groups.length === 0) return undefined;

  const leases: t.FsRooted.Lease[] = [];
  try {
    for (const group of groups) {
      const rooted = await Fs.Capability.Rooted.create({
        root: group.parent,
        create: false,
        until: args.signal,
      });
      if (rooted.path !== group.parent) {
        throw new Error(`Deploy staging build-source parent is not canonical: ${group.parent}`);
      }

      const admission = await rooted.admit(
        group.sources.map((source) => ({
          kind: 'directory' as const,
          path: Path.basename(source),
        })),
        { until: args.signal },
      );
      const acquired = await rooted.acquireLease(admission.targets, {
        mode: 'exclusive',
        wait: false,
        until: args.signal,
      });
      if (acquired.kind === 'busy') {
        const source = Path.join(group.parent, acquired.target.path);
        throw new Error(
          `Deploy staging build source is already owned by another operation: ${source}`,
        );
      }
      leases.push(acquired.lease);
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

function buildLeaseGroups(
  mappings: readonly PreparedStagingMapping[],
): readonly LeaseGroup[] {
  const sources = [
    ...new Set(
      mappings
        .filter((mapping) => mapping.mode === 'build+copy')
        .map((mapping) => mapping.source),
    ),
  ].toSorted(Str.Compare.codeUnit());
  const grouped = new Map<t.StringAbsoluteDir, t.StringAbsoluteDir[]>();
  for (const source of sources) {
    const parent: t.StringAbsoluteDir = Path.dirname(source);
    const current = grouped.get(parent) ?? [];
    current.push(source);
    grouped.set(parent, current);
  }

  return Object.freeze(
    [...grouped.entries()]
      .toSorted(([left], [right]) => Str.Compare.codeUnit()(left, right))
      .map(([parent, values]) =>
        Object.freeze({
          parent,
          sources: Object.freeze(values.toSorted(Str.Compare.codeUnit())),
        })
      ),
  );
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
