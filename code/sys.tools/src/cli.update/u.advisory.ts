import { Fs, Is, Json, Path, pkg, Semver, type t } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { resolveUpdateAdvisoryPath } from './u.advisory.path.ts';

const TTL_MSEC = 24 * 60 * 60 * 1000;
const DEBUG_REMOTE_ENV = 'SYS_TOOLS_DEBUG_UPDATE_ADVISORY_REMOTE';

type Clock = { now(): number };
type ReadDeps = { readonly clock?: Clock; readonly path?: t.StringPath };
type WriteDeps = { readonly clock?: Clock; readonly path?: t.StringPath };

export type UpdateAdvisoryRecord = {
  readonly package: string;
  readonly checkedAt: string;
  readonly ok: boolean;
  readonly remote?: string;
  readonly error?: string;
};

export type UpdateAdvisoryState = {
  readonly path?: t.StringPath;
  readonly record?: UpdateAdvisoryRecord;
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
  const stale = shouldRefreshUpdateAdvisory(record, { clock: deps.clock });
  const hasUpdate = wrangle.hasUpdate(record);
  return {
    path,
    record,
    stale,
    hasUpdate,
    prelude: hasUpdate ? toRootUpdateAdvisoryPrelude(record) : undefined,
  };
}

export async function writeUpdateAdvisorySuccess(remote: string, deps: WriteDeps = {}) {
  const path = deps.path ?? resolveUpdateAdvisoryPath();
  if (!path) return;

  await writeUpdateAdvisoryRecord(path, {
    package: pkg.name,
    checkedAt: wrangle.checkedAt(deps.clock),
    ok: true,
    remote,
  });
}

export async function writeUpdateAdvisoryFailure(error: unknown, deps: WriteDeps = {}) {
  const path = deps.path ?? resolveUpdateAdvisoryPath();
  if (!path) return;

  await writeUpdateAdvisoryRecord(path, {
    package: pkg.name,
    checkedAt: wrangle.checkedAt(deps.clock),
    ok: false,
    error: wrangle.error(error),
  });
}

export function shouldRefreshUpdateAdvisory(
  record?: UpdateAdvisoryRecord,
  deps: { readonly clock?: Clock } = {},
): boolean {
  if (!record) return true;

  const checkedAt = Date.parse(record.checkedAt);
  if (!Number.isFinite(checkedAt)) return true;
  return ((deps.clock?.now() ?? Date.now()) - checkedAt) >= TTL_MSEC;
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
  checkedAt(clock?: Clock) {
    return new Date(clock?.now() ?? Date.now()).toISOString();
  },

  error(value: unknown) {
    if (value instanceof Error && value.message.trim()) return value.message.trim();
    if (typeof value === 'string' && value.trim()) return value.trim();
    return 'probe-failed';
  },

  debugRecord(): UpdateAdvisoryRecord | undefined {
    const remote = Deno.env.get(DEBUG_REMOTE_ENV)?.trim();
    if (!remote) return undefined;
    return {
      package: pkg.name,
      checkedAt: new Date().toISOString(),
      ok: true,
      remote,
    };
  },

  hasUpdate(record?: UpdateAdvisoryRecord) {
    if (!record?.ok) return false;
    if (record.package !== pkg.name) return false;
    if (!Is.str(record.remote) || !record.remote.trim()) return false;

    const local = pkg.version;
    const remote = record.remote.trim() as t.StringSemver;
    const latest = Semver.latest(local, remote) ?? '';
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

    if (!Is.str(packageName) || !Is.str(checkedAt) || !Is.bool(ok)) return undefined;
    if (remote !== undefined && !Is.str(remote)) return undefined;
    if (error !== undefined && !Is.str(error)) return undefined;

    return {
      package: packageName,
      checkedAt,
      ok,
      ...(remote !== undefined ? { remote } : {}),
      ...(error !== undefined ? { error } : {}),
    };
  },
} as const;

export const UpdateAdvisory = {
  readState: readUpdateAdvisoryState,
  shouldRefresh: shouldRefreshUpdateAdvisory,
  toRootPrelude: toRootUpdateAdvisoryPrelude,
  writeSuccess: writeUpdateAdvisorySuccess,
  writeFailure: writeUpdateAdvisoryFailure,
} as const;
