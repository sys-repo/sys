import { Num, Semver, Time, type t } from './common.ts';

type VersionStateInput = Omit<t.UpgradeTool.VersionInfo, 'is'> & {
  readonly is?: Partial<t.UpgradeTool.VersionInfo['is']>;
};

/** Derive the single upgrade truth state from published and Deno-actionable facts. */
export function toVersionState(input: VersionStateInput): t.UpgradeTool.VersionState {
  const hasNewerRelease = Semver.Is.greaterThan(input.remote, input.local);
  const resolverUnavailable = hasNewerRelease &&
    (input.is?.resolverUnavailable === true || input.resolution?.ok === false);
  const verifiedLatest = input.latestResolution?.ok === true
    ? input.latestResolution.resolved
    : undefined;
  const actionable = resolverUnavailable
    ? undefined
    : verifiedLatest ?? input.actionable ?? input.latest;
  const upgradeAvailable = hasNewerRelease &&
    !resolverUnavailable &&
    actionable !== undefined &&
    Semver.Is.greaterThan(actionable, input.local);
  const computedPending = actionable !== undefined && Semver.Is.greaterThan(input.remote, actionable);
  const pending = !upgradeAvailable && hasNewerRelease && (input.is?.pending ?? computedPending);
  const status = toAdvisoryStatus({ upgradeAvailable, pending, resolverUnavailable });
  const reason = resolverReason(input);
  const minimumDependencyAgeStanddown = standdownTiming(input, pending, reason);

  return {
    hasNewerRelease,
    actionable,
    upgradeAvailable,
    pending,
    resolverUnavailable,
    status,
    ...(reason ? { reason } : {}),
    ...(minimumDependencyAgeStanddown ? { minimumDependencyAgeStanddown } : {}),
  };
}

/** Resolve the canonical upgrade/advisory status from derived truth flags. */
function toAdvisoryStatus(
  state: Pick<t.UpgradeTool.VersionState, 'upgradeAvailable' | 'pending' | 'resolverUnavailable'>,
): t.UpgradeTool.AdvisoryStatus {
  if (state.resolverUnavailable) return 'resolver-unavailable';
  if (state.upgradeAvailable) return 'upgrade-available';
  if (state.pending) return 'pending';
  return 'none';
}

/** Derive proven minimum dependency age timing from registry and resolver facts. */
function standdownTiming(
  input: Pick<t.UpgradeTool.VersionInfo, 'remote' | 'remoteCreatedAt'>,
  pending: boolean,
  reason?: t.WorkspaceResolve.PackageResolutionReason,
): t.UpgradeTool.MinimumDependencyAgeStanddown | undefined {
  if (!pending) return undefined;
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
    remaining,
  };
}

/** Prefer the pinned-latest resolver reason, then the unpinned resolver reason. */
function resolverReason(
  input: Pick<t.UpgradeTool.VersionInfo, 'resolution' | 'latestResolution'>,
): t.WorkspaceResolve.PackageResolutionReason | undefined {
  if (input.latestResolution?.ok === false) return input.latestResolution.reason;
  if (input.resolution?.ok === false) return input.resolution.reason;
  return undefined;
}
