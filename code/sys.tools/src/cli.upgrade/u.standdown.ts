import { Is, Num, Semver, Time, type t } from './common.ts';

type VersionFactInput = Pick<t.UpgradeTool.VersionInfo, 'remote' | 'remoteCreatedAt'>;
type StanddownRemaining = t.Msecs | 'elapsed';

/** Minimum-dependency-age standdown timing helpers. */
export const StanddownTiming = {
  /** Derive proven timing from registry and resolver facts. */
  minimumDependencyAge(
    input: VersionFactInput,
    standingDown: boolean,
    reason?: t.WorkspaceResolve.PackageResolutionReason,
  ): t.UpgradeTool.MinimumDependencyAgeStanddown | undefined {
    if (!standingDown) return undefined;
    if (reason?.code !== 'policy:minimum-dependency-age') return undefined;
    if (!input.remoteCreatedAt || !reason.minimumDependencyDate) return undefined;

    const createdAt = Time.utc(input.remoteCreatedAt).timestamp;
    const minimumDependencyDate = Time.utc(reason.minimumDependencyDate).timestamp;
    const remaining = createdAt - minimumDependencyDate;
    if (!Num.Is.finite(remaining) || remaining <= 0) return undefined;

    return {
      version: input.remote,
      createdAt: input.remoteCreatedAt,
      minimumDependencyDate: reason.minimumDependencyDate,
      remaining: remaining as t.Msecs,
    };
  },

  /** Return current remaining time, optionally aging a cached timing fact. */
  remaining(
    timing: t.UpgradeTool.MinimumDependencyAgeStanddown | undefined,
    options: { readonly checkedAt?: t.UnixTimestamp; readonly now?: t.UnixTimestamp } = {},
  ): StanddownRemaining | undefined {
    if (!timing) return undefined;

    const elapsed = options.checkedAt !== undefined && options.now !== undefined
      ? Num.clamp(0, Num.INFINITY, options.now - options.checkedAt)
      : 0;
    const remaining = timing.remaining - elapsed;
    if (!Num.Is.finite(remaining)) return undefined;
    return remaining > 0 ? (remaining as t.Msecs) : 'elapsed';
  },

  /** Parse a persisted timing fact fail-quiet. */
  parse(value: unknown): t.UpgradeTool.MinimumDependencyAgeStanddown | undefined {
    if (!Is.record(value)) return undefined;
    const version = value['version'];
    const createdAt = value['createdAt'];
    const minimumDependencyDate = value['minimumDependencyDate'];
    const rawRemaining = value['remaining'];

    if (!Is.str(version) || !Semver.Is.valid(version)) return undefined;
    if (!Is.str(createdAt) || !Num.Is.finite(Time.utc(createdAt).timestamp)) return undefined;
    if (!Is.str(minimumDependencyDate)) return undefined;
    if (!Num.Is.finite(Time.utc(minimumDependencyDate).timestamp)) return undefined;
    if (!Num.Is.safeInt(rawRemaining) || rawRemaining <= 0) return undefined;

    return {
      version: version as t.StringSemver,
      createdAt: createdAt as t.StringTimestamp,
      minimumDependencyDate: minimumDependencyDate as t.StringTimestamp,
      remaining: rawRemaining as t.Msecs,
    };
  },

  /** Format a proven standdown duration for compact CLI display. */
  formatDuration(input: t.Msecs): string {
    const msecs = Num.clamp(0, Num.INFINITY, input) as t.Msecs;
    return Time.duration(msecs).toString();
  },

  /** Format the canonical minimum-dependency-age wait copy. */
  formatWait(input?: t.Msecs): string {
    const reason = 'minimum dependency age window';
    return input === undefined
      ? `waiting for the ${reason} to pass`
      : `waiting ${StanddownTiming.formatDuration(input)} for the ${reason} to pass`;
  },
} as const;
