import { Is } from '../common.ts';

type Measurement = {
  readonly width?: number;
  readonly height?: number;
};

type DenoRuntime = {
  consoleSize?: () => { columns: number; rows: number };
};

type NodeRuntime = {
  stdout?: { columns?: number; rows?: number };
};

type Runtime = {
  Deno?: DenoRuntime;
  process?: NodeRuntime;
};

type ReadRuntime = () => Runtime;
type ObserveResize = (handler: () => void) => () => void;

/** Internal platform adapter for terminal measurement and resize observation. */
export function createPlatform(
  readRuntime: ReadRuntime,
  observeResize: ObserveResize = (handler) => {
    Deno.addSignalListener('SIGWINCH', handler);
    return () => Deno.removeSignalListener('SIGWINCH', handler);
  },
) {
  return {
    measure(): Measurement | undefined {
      const runtime = readRuntime();
      const deno = runtime.Deno;

      try {
        if (deno?.consoleSize) {
          const { columns, rows } = deno.consoleSize();
          return {
            width: wrangle.dimension(columns),
            height: wrangle.dimension(rows),
          };
        }
      } catch {
        // Ignore and fall through to the Node-style runtime.
      }

      const stdout = runtime.process?.stdout;
      if (!stdout) return undefined;

      const width = wrangle.dimension(stdout.columns);
      const height = wrangle.dimension(stdout.rows);
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
const wrangle = {
  dimension(input: unknown) {
    return Is.num(input) && input > 0 ? input : undefined;
  },
} as const;
