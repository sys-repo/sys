import {
  type AuthorityCheck,
  type AuthoritySnapshot,
  createSynchronousAuthority,
  snapshotProperty,
  snapshotsReady,
} from '../u/u.authority.ts';
import { ScreenMeasure, type ScreenMeasurement } from './u.measure.ts';

export type ScreenResizeObservation =
  | { readonly kind: 'attached'; readonly stop: () => void }
  | { readonly kind: 'unsupported' };

type DenoRuntime = {
  consoleSize?: () => { columns: number; rows: number };
  build?: { readonly os?: string };
  addSignalListener?: (signal: 'SIGWINCH', handler: () => void) => void;
  removeSignalListener?: (signal: 'SIGWINCH', handler: () => void) => void;
};

type NodeRuntime = {
  stdout?: { columns?: number; rows?: number };
};

type Runtime = {
  Deno?: DenoRuntime;
  process?: NodeRuntime;
};

type ReadRuntime = () => Runtime;
type ObserveResize = (handler: () => void) => ScreenResizeObservation;
type RuntimeDimension = Readonly<{
  readonly read: () => unknown;
  readonly isReady: AuthorityCheck;
}>;

const apply = Reflect.apply;
const arrayPush = Array.prototype.push;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const runtime = globalThis as unknown as Runtime;
const snapshots: AuthoritySnapshot[] = [
  snapshotProperty(globalThis, 'Deno'),
  snapshotProperty(globalThis, 'process'),
];
const checks: AuthorityCheck[] = [() => snapshotsReady(snapshots)];
const deno = runtime.Deno;
const denoConsoleSize = captureMethod(deno, 'consoleSize');
const process = readOwnProperty(globalThis, 'process') as NodeRuntime | undefined;
const stdout = process && readOwnProperty(process, 'stdout');
const columns = captureRuntimeDimension(stdout, 'columns');
const rows = captureRuntimeDimension(stdout, 'rows');
if (columns) apply(arrayPush, checks, [columns.isReady]);
if (rows) apply(arrayPush, checks, [rows.isReady]);
const authority = createSynchronousAuthority(
  'Cli.Screen measurement authority unavailable.',
  checks,
);
freeze(snapshots);
freeze(checks);

/** Whether production terminal measurement still matches its module-initialization providers. */
export const isScreenMeasurementAuthorityReady = authority.isReady;

/** Internal platform adapter for terminal measurement and resize observation. */
export function createPlatform(
  readRuntime: ReadRuntime,
  observeResize: ObserveResize = createResizeObserver(readRuntime),
) {
  return {
    measure(): ScreenMeasurement | undefined {
      const runtime = readRuntime();
      const deno = runtime.Deno;

      try {
        if (deno?.consoleSize) {
          const { columns, rows } = deno.consoleSize();
          return {
            width: ScreenMeasure.dimension(columns),
            height: ScreenMeasure.dimension(rows),
          };
        }
      } catch {
        // Ignore and fall through to the Node-style runtime.
      }

      const stdout = runtime.process?.stdout;
      if (!stdout) return undefined;

      const width = ScreenMeasure.dimension(stdout.columns);
      const height = ScreenMeasure.dimension(stdout.rows);
      return width === undefined || height === undefined ? undefined : { width, height };
    },

    observeResize,
  } as const;
}

export const ScreenPlatform = freeze({
  measure: measureRuntime,
  observeResize: createResizeObserver(() => globalThis as unknown as Runtime),
});

/**
 * Helpers:
 */
function measureRuntime(): ScreenMeasurement | undefined {
  if (!authority.isReady()) return;

  if (deno && denoConsoleSize) {
    try {
      const measured = authority.run(() => apply(denoConsoleSize, deno, [])) as {
        columns: unknown;
        rows: unknown;
      };
      return {
        width: authority.run(() => ScreenMeasure.dimension(measured.columns)),
        height: authority.run(() => ScreenMeasure.dimension(measured.rows)),
      };
    } catch {
      // Continue through the independently captured Node-style fallback.
    }
  }

  if (!columns || !rows) return;
  const width = readDimension(columns);
  const height = readDimension(rows);
  return width === undefined || height === undefined ? undefined : { width, height };
}

function captureMethod<T extends object, K extends PropertyKey>(
  owner: T | undefined,
  key: K,
): ((...args: never[]) => unknown) | undefined {
  if (!owner) return;
  apply(arrayPush, snapshots, [snapshotProperty(owner, key)]);
  const descriptor = getOwnPropertyDescriptor(owner, key);
  return descriptor && 'value' in descriptor && typeof descriptor.value === 'function'
    ? descriptor.value
    : undefined;
}

function captureRuntimeDimension(
  owner: unknown,
  key: PropertyKey,
): RuntimeDimension | undefined {
  if ((typeof owner !== 'object' && typeof owner !== 'function') || owner === null) return;

  const receiver = owner;
  const chain: object[] = [];
  let current: object | null = receiver;
  while (current) {
    apply(arrayPush, chain, [current]);
    const descriptor = getOwnPropertyDescriptor(current, key);
    if (descriptor) {
      for (let index = 0; index < chain.length - 1; index += 1) {
        apply(arrayPush, snapshots, [snapshotProperty(chain[index], key)]);
      }
      const owner = current;
      const prototypes = freeze(chain);
      const chainReady = () => {
        for (let index = 0; index < prototypes.length - 1; index += 1) {
          if (getPrototypeOf(prototypes[index]) !== prototypes[index + 1]) return false;
        }
        return true;
      };

      if ('value' in descriptor) {
        const configurable = descriptor.configurable;
        const enumerable = descriptor.enumerable;
        const writable = descriptor.writable;
        return freeze({
          read: () => getOwnPropertyDescriptor(owner, key)?.value,
          isReady: () => {
            if (!chainReady()) return false;
            const actual = getOwnPropertyDescriptor(owner, key);
            return !!actual && 'value' in actual && actual.configurable === configurable &&
              actual.enumerable === enumerable && actual.writable === writable;
          },
        });
      }

      // The getter is a trusted module-initialization provider. Its exact descriptor and receiver
      // chain remain monitored; this does not authenticate a closure installed before import.
      const configurable = descriptor.configurable;
      const enumerable = descriptor.enumerable;
      const getter = descriptor.get;
      const setter = descriptor.set;
      return freeze({
        read: () => getter ? apply(getter, receiver, []) : undefined,
        isReady: () => {
          if (!chainReady()) return false;
          const actual = getOwnPropertyDescriptor(owner, key);
          return !!actual && !('value' in actual) && actual.configurable === configurable &&
            actual.enumerable === enumerable && actual.get === getter && actual.set === setter;
        },
      });
    }
    current = getPrototypeOf(current);
  }
}

function readDimension(source: RuntimeDimension): number | undefined {
  try {
    return ScreenMeasure.dimension(authority.run(source.read));
  } catch {
    return;
  }
}

function readOwnProperty(owner: object, key: PropertyKey): unknown {
  apply(arrayPush, snapshots, [snapshotProperty(owner, key)]);
  const descriptor = getOwnPropertyDescriptor(owner, key);
  if (!descriptor) return;
  if ('value' in descriptor) return descriptor.value;
  try {
    return descriptor.get ? apply(descriptor.get, owner, []) : undefined;
  } catch {
    return;
  }
}

function createResizeObserver(readRuntime: ReadRuntime): ObserveResize {
  return (handler) => {
    const deno = readRuntime().Deno;
    const add = deno?.addSignalListener;
    const remove = deno?.removeSignalListener;
    const unsupported = deno?.build?.os === 'windows' || !add || !remove;
    if (unsupported) return { kind: 'unsupported' };

    add('SIGWINCH', handler);
    return {
      kind: 'attached',
      stop: () => remove('SIGWINCH', handler),
    };
  };
}
