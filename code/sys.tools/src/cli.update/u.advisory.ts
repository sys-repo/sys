import { Fs, Is, Json, Num, Path, pkg, Semver, Time, type t } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { resolveUpdateAdvisoryPath } from './u.advisory.path.ts';

const TTL_MSEC = 24 * 60 * 60 * 1000;
const DEBUG_REMOTE_ENV = 'SYS_TOOLS_DEBUG_UPDATE_ADVISORY_REMOTE';

type Now = () => t.UnixTimestamp;
type ReadDeps = { readonly now?: Now; readonly path?: t.StringPath };
type WriteDeps = { readonly now?: Now; readonly path?: t.StringPath };
type UpdateAdvisoryRecord = t.UpdateTool.AdvisoryRecord;

export type UpdateAdvisoryState = {
  readonly path?: t.StringPath;
  readonly record?: t.UpdateTool.AdvisoryRecord;
  readonly stale: boolean;
  readonly hasUpdate: boolean;
  readonly prelude?: string;
};

export async function readUpdateAdvisoryState(deps: ReadDeps = {}): Promise<UpdateAdvisoryState> {
  const debugRecord = wrangle.debugRecord();
  if (debugRecord) {
    const hasUpdate = wrangle.hasUpdate(debugRecord);
    return {
      path: undefined,
      record: debugRecord,
      stale: false,
      hasUpdate,
      prelude: hasUpdate ? toRootUpdateAdvisoryPrelude(debugRecord) : undefined,
    };
  }

  const path = deps.path ?? resolveUpdateAdvisoryPath();
  if (!path) return { path: undefined, record: undefined, stale: false, hasUpdate: false, prelude: undefined };

  const record = await readUpdateAdvisoryRecord(path);
  const stale = shouldRefreshUpdateAdvisory(record, { now: deps.now });
  const hasUpdate = wrangle.hasUpdate(record);
  return {
    path,
    record,
    stale,
    hasUpdate,
    prelude: hasUpdate ? toRootUpdateAdvisoryPrelude(record) : undefined,
  };
}

export async function writeUpdateAdvisorySuccess(remote: t.StringSemver, deps: WriteDeps = {}) {
  const path = deps.path ?? resolveUpdateAdvisoryPath();
  if (!path) return;

  await writeUpdateAdvisoryRecord(path, {
    package: pkg.name,
    checkedAt: wrangle.checkedAt(deps.now),
    ok: true,
    remote,
  });
}

export async function writeUpdateAdvisoryFailure(error: unknown, deps: WriteDeps = {}) {
  const path = deps.path ?? resolveUpdateAdvisoryPath();
  if (!path) return;

  await writeUpdateAdvisoryRecord(path, {
    package: pkg.name,
    checkedAt: wrangle.checkedAt(deps.now),
    ok: false,
    error: wrangle.error(error),
  });
}

export function shouldRefreshUpdateAdvisory(
  record?: UpdateAdvisoryRecord,
  deps: { readonly now?: Now } = {},
): boolean {
  if (!record) return true;
  if (record.package !== pkg.name) return true;
  if (!Num.Is.safeInt(record.checkedAt) || record.checkedAt < 0) return true;
  return ((deps.now?.() ?? Time.now.timestamp) - record.checkedAt) >= TTL_MSEC;
}

export function toRootUpdateAdvisoryPrelude(record?: UpdateAdvisoryRecord): string | undefined {
  if (!wrangle.hasUpdate(record)) return undefined;
  return Fmt.rootAdvisoryPrelude();
}

async function readUpdateAdvisoryRecord(path: t.StringPath): Promise<UpdateAdvisoryRecord | undefined> {
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

async function writeUpdateAdvisoryRecord(path: t.StringPath, record: UpdateAdvisoryRecord) {
  await Fs.ensureDir(Path.dirname(path));
  await Fs.write(path, Json.stringify(record, 2));
}

const wrangle = {
  checkedAt(now?: Now): t.UnixTimestamp {
    return now?.() ?? Time.now.timestamp;
  },

  error(value: unknown) {
    if (value instanceof Error && value.message.trim()) return value.message.trim();
    if (typeof value === 'string' && value.trim()) return value.trim();
    return 'probe-failed';
  },

  debugRecord(): UpdateAdvisoryRecord | undefined {
    const remote = Deno.env.get(DEBUG_REMOTE_ENV)?.trim();
    if (!remote || !Semver.Is.valid(remote)) return undefined;
    return {
      package: pkg.name,
      checkedAt: wrangle.checkedAt(),
      ok: true,
      remote: remote as t.StringSemver,
    };
  },

  hasUpdate(record?: UpdateAdvisoryRecord) {
    if (!record?.ok) return false;
    if (record.package !== pkg.name) return false;
    const local = pkg.version;
    const latest = Semver.latest(local, record.remote) ?? '';
    return Boolean(latest && latest !== local);
  },

  record(value: unknown): UpdateAdvisoryRecord | undefined {
    if (typeof value !== 'object' || value === null) return undefined;

    const record = value as Record<string, unknown>;
    const packageName = record['package'];
    const checkedAt = record['checkedAt'];
    const ok = record['ok'];
    const remote = record['remote'];
    const error = record['error'];

    if (!Is.str(packageName) || !Num.Is.safeInt(checkedAt) || checkedAt < 0 || !Is.bool(ok)) return undefined;

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

export const UpdateAdvisory = {
  readState: readUpdateAdvisoryState,
  shouldRefresh: shouldRefreshUpdateAdvisory,
  toRootPrelude: toRootUpdateAdvisoryPrelude,
  writeSuccess: writeUpdateAdvisorySuccess,
  writeFailure: writeUpdateAdvisoryFailure,
} as const;
