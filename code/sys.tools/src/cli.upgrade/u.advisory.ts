import { Fs, Is, Json, Num, Path, pkg, Semver, type t, Time } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { resolveUpgradeAdvisoryPath } from './u.advisory.path.ts';

const DEBUG_REMOTE_ENV = 'SYS_TOOLS_DEBUG_UPGRADE_ADVISORY_REMOTE';

type Now = () => t.UnixTimestamp;
type ReadDeps = { readonly path?: t.StringPath };
type WriteDeps = { readonly now?: Now; readonly path?: t.StringPath };
type UpgradeAdvisoryRecord = t.UpgradeTool.AdvisoryRecord;

export type UpgradeAdvisoryState = {
  readonly path?: t.StringPath;
  readonly record?: t.UpgradeTool.AdvisoryRecord;
  readonly hasUpgrade: boolean;
  readonly prelude?: string;
};

export async function readUpgradeAdvisoryState(deps: ReadDeps = {}): Promise<UpgradeAdvisoryState> {
  const debugRecord = wrangle.debugRecord();
  if (debugRecord) {
    const hasUpgrade = wrangle.hasUpgrade(debugRecord);
    return {
      path: undefined,
      record: debugRecord,
      hasUpgrade,
      prelude: hasUpgrade ? toRootUpgradeAdvisoryPrelude(debugRecord) : undefined,
    };
  }

  const path = deps.path ?? resolveUpgradeAdvisoryPath();
  if (!path) {
    return {
      path: undefined,
      record: undefined,
      hasUpgrade: false,
      prelude: undefined,
    };
  }

  const record = await readUpgradeAdvisoryRecord(path);
  const hasUpgrade = wrangle.hasUpgrade(record);
  return {
    path,
    record,
    hasUpgrade,
    prelude: hasUpgrade ? toRootUpgradeAdvisoryPrelude(record) : undefined,
  };
}

export async function writeUpgradeAdvisorySuccess(
  version: t.UpgradeTool.VersionInfo,
  deps: WriteDeps = {},
) {
  const path = deps.path ?? resolveUpgradeAdvisoryPath();
  if (!path) return;

  await writeUpgradeAdvisoryRecord(path, wrangle.successRecord(version, deps.now));
}

export async function writeUpgradeAdvisoryFailure(error: unknown, deps: WriteDeps = {}) {
  const path = deps.path ?? resolveUpgradeAdvisoryPath();
  if (!path) return;

  await writeUpgradeAdvisoryRecord(path, {
    schemaVersion: 2,
    package: pkg.name,
    checkedAt: wrangle.checkedAt(deps.now),
    ok: false,
    error: wrangle.error(error),
  });
}

export function toRootUpgradeAdvisoryPrelude(record?: UpgradeAdvisoryRecord): string | undefined {
  if (!record?.ok) return undefined;
  if (!wrangle.hasUpgrade(record)) return undefined;
  return Fmt.rootAdvisoryPrelude(record.actionable);
}

export function toUpgradeAdvisoryStateFromVersionInfo(
  version: t.UpgradeTool.VersionInfo,
  deps: { readonly now?: Now; readonly path?: t.StringPath } = {},
): UpgradeAdvisoryState {
  const record = wrangle.successRecord(version, deps.now);
  const hasUpgrade = wrangle.hasUpgrade(record);
  return {
    path: deps.path,
    record,
    hasUpgrade,
    prelude: hasUpgrade ? toRootUpgradeAdvisoryPrelude(record) : undefined,
  };
}

async function readUpgradeAdvisoryRecord(
  path: t.StringPath,
): Promise<UpgradeAdvisoryRecord | undefined> {
  if (!(await Fs.exists(path))) return undefined;

  const read = await Fs.readText(path);
  if (!read.ok || !read.data) return undefined;

  try {
    const parsed = Json.parse(read.data);
    return wrangle.record(parsed);
  } catch {
    return undefined;
  }
}

async function writeUpgradeAdvisoryRecord(path: t.StringPath, record: UpgradeAdvisoryRecord) {
  await Fs.ensureDir(Path.dirname(path));
  await Fs.write(path, Json.stringify(record, 2));
}

const wrangle = {
  checkedAt(now?: Now): t.UnixTimestamp {
    return now?.() ?? Time.now.timestamp;
  },

  error(value: unknown) {
    if (value instanceof Error && value.message.trim()) return value.message.trim();
    if (Is.str(value) && value.trim()) return value.trim();
    return 'probe-failed';
  },

  successRecord(
    version: t.UpgradeTool.VersionInfo,
    now?: Now,
  ): Extract<UpgradeAdvisoryRecord, { readonly ok: true }> {
    const resolverUnavailable = version.is.resolverUnavailable ?? version.resolution?.ok === false;
    const actionable = resolverUnavailable ? undefined : version.actionable ?? version.latest;
    const reason = version.resolution?.ok === false ? version.resolution.reason : undefined;
    const status = wrangle.status(version);

    return {
      schemaVersion: 2,
      package: pkg.name,
      checkedAt: wrangle.checkedAt(now),
      ok: true,
      local: version.local,
      published: version.remote,
      ...(actionable ? { actionable } : {}),
      status,
      ...(reason ? { reason } : {}),
    };
  },

  status(version: t.UpgradeTool.VersionInfo): t.UpgradeTool.AdvisoryStatus {
    const resolverUnavailable = version.is.resolverUnavailable ?? version.resolution?.ok === false;
    const upgradeAvailable = !resolverUnavailable &&
      (version.is.upgradeAvailable ?? !version.is.latest);
    const pending = !resolverUnavailable && (version.is.pending ?? false);

    if (resolverUnavailable) return 'resolver-unavailable';
    if (upgradeAvailable) return 'upgrade-available';
    if (pending) return 'pending';
    return 'none';
  },

  debugRecord(): UpgradeAdvisoryRecord | undefined {
    const remote = Deno.env.get(DEBUG_REMOTE_ENV)?.trim();
    if (!remote || !Semver.Is.valid(remote)) return undefined;

    const published = remote as t.StringSemver;
    const local = pkg.version as t.StringSemver;
    const upgradeAvailable = Semver.Is.greaterThan(published, local);
    return {
      schemaVersion: 2,
      package: pkg.name,
      checkedAt: wrangle.checkedAt(),
      ok: true,
      local,
      published,
      actionable: published,
      status: upgradeAvailable ? 'upgrade-available' : 'none',
    };
  },

  hasUpgrade(record?: UpgradeAdvisoryRecord) {
    if (!record?.ok) return false;
    if (record.package !== pkg.name) return false;
    if (record.status !== 'upgrade-available') return false;
    if (!record.actionable) return false;
    return Semver.Is.greaterThan(record.actionable, pkg.version as t.StringSemver);
  },

  record(value: unknown): UpgradeAdvisoryRecord | undefined {
    if (!Is.record(value)) return undefined;

    const record = value;
    const schemaVersion = record['schemaVersion'];
    const packageName = record['package'];
    const checkedAt = record['checkedAt'];
    const ok = record['ok'];
    const error = record['error'];

    if (schemaVersion !== 2) return undefined;
    if (!Is.str(packageName) || !Num.Is.safeInt(checkedAt) || checkedAt < 0 || !Is.bool(ok)) {
      return undefined;
    }

    const base = {
      schemaVersion: 2,
      package: packageName as t.StringPkgName,
      checkedAt: checkedAt as t.UnixTimestamp,
    } as const;

    if (ok) {
      const local = record['local'];
      const published = record['published'];
      const actionable = record['actionable'];
      const status = record['status'];
      const reason = record['reason'];

      if (!Is.str(local) || !Semver.Is.valid(local)) return undefined;
      if (!Is.str(published) || !Semver.Is.valid(published)) return undefined;
      if (!wrangle.advisoryStatus(status)) return undefined;
      if (error !== undefined) return undefined;
      if (actionable !== undefined && (!Is.str(actionable) || !Semver.Is.valid(actionable))) {
        return undefined;
      }
      if ((status === 'upgrade-available' || status === 'pending') && actionable === undefined) {
        return undefined;
      }

      const parsedReason = reason === undefined ? undefined : wrangle.reason(reason);
      if (reason !== undefined && !parsedReason) return undefined;

      return {
        ...base,
        ok: true,
        local: local as t.StringSemver,
        published: published as t.StringSemver,
        ...(actionable ? { actionable: actionable as t.StringSemver } : {}),
        status,
        ...(parsedReason ? { reason: parsedReason } : {}),
      };
    }

    if (!Is.str(error)) return undefined;
    return { ...base, ok: false, error };
  },

  advisoryStatus(value: unknown): value is t.UpgradeTool.AdvisoryStatus {
    return value === 'none' ||
      value === 'upgrade-available' ||
      value === 'pending' ||
      value === 'resolver-unavailable';
  },

  reason(value: unknown): t.WorkspaceResolve.PackageResolutionReason | undefined {
    if (!Is.record(value)) return undefined;
    const code = value['code'];
    const message = value['message'];
    if (
      code !== 'policy:minimum-dependency-age' &&
      code !== 'config-or-lock' &&
      code !== 'registry' &&
      code !== 'unknown'
    ) return undefined;
    if (message !== undefined && !Is.str(message)) return undefined;
    return message === undefined ? { code } : { code, message };
  },
} as const;

export const UpgradeAdvisory = {
  readState: readUpgradeAdvisoryState,
  toRootPrelude: toRootUpgradeAdvisoryPrelude,
  toStateFromVersionInfo: toUpgradeAdvisoryStateFromVersionInfo,
  writeSuccess: writeUpgradeAdvisorySuccess,
  writeFailure: writeUpgradeAdvisoryFailure,
} as const;
