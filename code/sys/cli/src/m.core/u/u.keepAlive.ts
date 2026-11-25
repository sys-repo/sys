import { Process, Rx, type t } from '../common.ts';

type Deps = {
  readonly on: typeof Process.Signal.on;
  readonly exit: (code: number) => never;
};

export const keepAlive = createKeepAlive({
  on: Process.Signal.on,
  exit: (code) => Deno.exit(code),
});

/** Require Ctrl-C handling before startup, then exit after lifecycle disposal. */
export function createKeepAlive({ on, exit }: Deps): t.Cli.Lib['keepAlive'] {
  return async (opts = {}) => {
    const { exitCode = 0, onStart } = opts;
    const life = opts.life ?? Rx.lifecycle();
    const binding = on('SIGINT', () => life.dispose());
    if (binding.kind === 'unsupported') throw new Error('Cli.keepAlive requires SIGINT.');

    const failures: unknown[] = [];
    try {
      if (onStart) await onStart(life);
      await new Promise<void>((resolve) => life.dispose$.subscribe({ complete: resolve }));
    } catch (cause) {
      failures.push(cause);
    } finally {
      for (const dispose of [binding.dispose, () => life.dispose()]) {
        try {
          dispose();
        } catch (cause) {
          failures.push(cause);
        }
      }
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1) {
      throw new AggregateError(failures, 'Cli.keepAlive failed.', { cause: failures[0] });
    }
    return exit(exitCode);
  };
}
