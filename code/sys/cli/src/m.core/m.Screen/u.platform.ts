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

export const ScreenPlatform = createPlatform(() => {
  return globalThis as unknown as Runtime;
});

/**
 * Helpers:
 */
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
