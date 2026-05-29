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

export async function writeUpgradeAdvisorySuccess(remote: t.StringSemver, deps: WriteDeps = {}) {
  const path = deps.path ?? resolveUpgradeAdvisoryPath();
  if (!path) return;

  await writeUpgradeAdvisoryRecord(path, {
    package: pkg.name,
    checkedAt: wrangle.checkedAt(deps.now),
    ok: true,
    remote,
  });
}

export async function writeUpgradeAdvisoryFailure(error: unknown, deps: WriteDeps = {}) {
  const path = deps.path ?? resolveUpgradeAdvisoryPath();
  if (!path) return;

  await writeUpgradeAdvisoryRecord(path, {
    package: pkg.name,
    checkedAt: wrangle.checkedAt(deps.now),
    ok: false,
    error: wrangle.error(error),
  });
}

export function toRootUpgradeAdvisoryPrelude(record?: UpgradeAdvisoryRecord): string | undefined {
  if (!record?.ok) return undefined;
  if (!wrangle.hasUpgrade(record)) return undefined;
  return Fmt.rootAdvisoryPrelude(record.remote);
}

export function toUpgradeAdvisoryStateFromRemote(
  remote: t.StringSemver,
  deps: { readonly now?: Now; readonly path?: t.StringPath } = {},
): UpgradeAdvisoryState {
  const record: UpgradeAdvisoryRecord = {
    package: pkg.name,
    checkedAt: wrangle.checkedAt(deps.now),
    ok: true,
    remote,
  };
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

  debugRecord(): UpgradeAdvisoryRecord | undefined {
    const remote = Deno.env.get(DEBUG_REMOTE_ENV)?.trim();
    if (!remote || !Semver.Is.valid(remote)) return undefined;
    return {
      package: pkg.name,
      checkedAt: wrangle.checkedAt(),
      ok: true,
      remote: remote as t.StringSemver,
    };
  },

  hasUpgrade(record?: UpgradeAdvisoryRecord) {
    if (!record?.ok) return false;
    if (record.package !== pkg.name) return false;
    const local = pkg.version;
    const latest = Semver.latest(local, record.remote) ?? '';
    return Boolean(latest && latest !== local);
  },

  record(value: unknown): UpgradeAdvisoryRecord | undefined {
    if (!Is.record(value)) return undefined;

    const record = value;
    const packageName = record['package'];
    const checkedAt = record['checkedAt'];
    const ok = record['ok'];
    const remote = record['remote'];
    const error = record['error'];

    if (!Is.str(packageName) || !Num.Is.safeInt(checkedAt) || checkedAt < 0 || !Is.bool(ok)) {
      return undefined;
    }

    const base = {
      package: packageName as t.StringPkgName,
      checkedAt: checkedAt as t.UnixTimestamp,
    } as const;

    if (ok) {
      if (!Is.str(remote) || !Semver.Is.valid(remote) || error !== undefined) return undefined;
      return { ...base, ok: true, remote: remote as t.StringSemver };
    }

    if (!Is.str(error) || remote !== undefined) return undefined;
    return { ...base, ok: false, error };
  },
} as const;

export const UpgradeAdvisory = {
  readState: readUpgradeAdvisoryState,
  toRootPrelude: toRootUpgradeAdvisoryPrelude,
  toStateFromRemote: toUpgradeAdvisoryStateFromRemote,
  writeSuccess: writeUpgradeAdvisorySuccess,
  writeFailure: writeUpgradeAdvisoryFailure,
} as const;
