import { Fs, Is, Obj, Path, type t } from '../common.ts';

const START_KEYS = ['cwd', 'paths', 'silent', 'until'] as const;
const RESOURCE_KEYS = ['cwd', 'paths'] as const;
const PATH_KEYS = ['config'] as const;

export type ServiceArgsSnapshot = Readonly<{
  cwd: t.StringDir;
  paths: Readonly<{ config: t.StringPath }>;
  silent?: boolean;
  until?: t.UntilInput;
}>;

/** Snapshot exact Cell-owned service authority before configuration I/O. */
export function snapshotServiceArgs(input: unknown, start: boolean): ServiceArgsSnapshot {
  const source = dataRecord(input, start ? START_KEYS : RESOURCE_KEYS, ['cwd', 'paths']);
  const paths = source && dataRecord(source.paths, PATH_KEYS, PATH_KEYS);
  if (!source || !paths) throw new Error('DistService: invalid service arguments.');

  const cwd = source.cwd;
  const config = paths.config;
  const silent = source.silent;
  const until = source.until;
  if (!Is.str(cwd) || cwd.length === 0 || cwd.includes('\0')) {
    throw new Error('DistService: invalid service arguments.');
  }
  if (!Is.str(config) || config.length === 0 || config.includes('\0')) {
    throw new Error('DistService: invalid service arguments.');
  }
  if (silent !== undefined && !Is.bool(silent)) {
    throw new Error('DistService: invalid service arguments.');
  }
  if (!Is.untilInput(until)) throw new Error('DistService: invalid service arguments.');

  return Object.freeze({
    cwd: cwd as t.StringDir,
    paths: Object.freeze({ config: config as t.StringPath }),
    ...(silent === undefined ? {} : { silent }),
    ...(until === undefined ? {} : { until }),
  });
}

/** Resolve the owner config path against Cell cwd. */
export function resolveConfigPath(args: ServiceArgsSnapshot): t.StringPath {
  const path = args.paths.config;
  return (Path.Is.absolute(path)
    ? Path.normalize(path)
    : Path.resolve(Fs.resolve(args.cwd), path)) as t.StringPath;
}

/** Resolve and confine the configured generation directory to Cell cwd. */
export function resolveDir(cwd: t.StringDir, dir: string): t.StringDir {
  const root = Fs.resolve(cwd);
  const resolved = Path.Is.absolute(dir) ? Path.normalize(dir) : Path.resolve(root, dir);
  if (!Path.Is.within(root, resolved)) {
    throw new Error('DistService: dir escapes service cwd.');
  }
  return resolved as t.StringDir;
}

/**
 * Helpers:
 */
function dataRecord(
  input: unknown,
  allowed: readonly string[],
  required: readonly string[],
): Record<string, unknown> | undefined {
  if (!Is.plainObject(input)) return;
  const keys = Reflect.ownKeys(input);
  if (keys.some((key) => !Is.str(key) || !allowed.includes(key))) return;
  if (required.some((key) => !Obj.hasOwn(input, key))) return;

  const output: Record<string, unknown> = {};
  for (const key of keys) {
    if (!Is.str(key)) return;
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor || !Obj.hasOwn(descriptor, 'value')) return;
    output[key] = descriptor.value;
  }
  return output;
}
