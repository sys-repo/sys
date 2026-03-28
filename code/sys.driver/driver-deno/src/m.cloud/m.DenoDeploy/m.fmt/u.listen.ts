import { type t, Cli, Rx, Time, c } from './common.ts';
import { InfoFmt } from './u.info.ts';
import { DENO_CONSOLE_HOST, print } from './u.shared.ts';

export const ListenFmt = {
  spinnerText(text: string) {
    return c.italic(c.gray(text));
  },

  stageSpinnerText() {
    return ListenFmt.spinnerText('staging workspace...');
  },

  deploySpinnerText() {
    return `${Cli.Fmt.spinnerText('deploying staged workspace to ', false)}${c.cyan(DENO_CONSOLE_HOST)}`;
  },

  spinner(text: string) {
    return Cli.spinner(text);
  },

  listen(deployment: t.DenoDeploy.Pipeline.Handle, hooks: t.DenoDeploy.Fmt.ListenHooks = {}) {
    const life = Rx.abortable();
    let spin: ReturnType<typeof ListenFmt.spinner> | undefined;
    let result: Extract<t.DenoDeploy.Deploy.Result, { readonly ok: true }> | undefined;
    let startedAt: t.Msecs | undefined;
    const verifying = deployment.request.verify?.preview !== false;
    const interactive = wrangle.interactive();
    deployment.$.pipe(Rx.takeUntil(life.dispose$)).subscribe((step) => {
      if (step.kind === 'stage:start') {
        startedAt = Time.now.timestamp as t.Msecs;
        print(InfoFmt.deployConfig({
          ...deployment.request.config,
          sourceDir: step.pkgDir,
          stagedDir: step.root,
        }));
        const extra = hooks.afterConfig?.({ deployment, step });
        if (extra && extra.length > 0) print(extra);
        wrangle.status({
          interactive,
          spin,
          text: ListenFmt.spinnerText('preparing staged root...'),
          set(next) {
            spin = next;
          },
        });
        return;
      }

      if (step.kind === 'build:start') {
        wrangle.status({
          interactive,
          spin,
          text: ListenFmt.spinnerText('building package in source workspace...'),
          set(next) {
            spin = next;
          },
        });
        return;
      }

      if (step.kind === 'build:done' || step.kind === 'stage:materialize:start') {
        wrangle.status({
          interactive,
          spin,
          text: ListenFmt.stageSpinnerText(),
          set(next) {
            spin = next;
          },
        });
        return;
      }

      if (step.kind === 'prepare:done') {
        spin?.stop();
        print(InfoFmt.stagedEntrypoint(step.prepared));
        wrangle.status({
          interactive,
          spin: undefined,
          text: ListenFmt.deploySpinnerText(),
          set(next) {
            spin = next;
          },
        });
        return;
      }

      if (step.kind === 'verify:start') {
        wrangle.status({
          interactive,
          spin,
          text: ListenFmt.spinnerText('verifying preview...'),
          set(next) {
            spin = next;
          },
        });
        return;
      }

      if (step.kind === 'build:failed') {
        spin?.stop();
        print(InfoFmt.pipelineFailure({ phase: 'build', error: step.error, at: wrangle.failedAt() }));
        return;
      }

      if (step.kind === 'stage:materialize:failed') {
        spin?.stop();
        print(InfoFmt.pipelineFailure({ phase: 'stage', error: step.error, at: wrangle.failedAt() }));
        return;
      }

      if (step.kind === 'prepare:failed') {
        spin?.stop();
        print(InfoFmt.pipelineFailure({ phase: 'prepare', error: step.error, at: wrangle.failedAt() }));
        return;
      }

      if (step.kind === 'deploy:done') {
        result = step.result;
        if (!verifying) {
          spin?.stop();
          print(InfoFmt.deployResult(step.result, 'Deploy Result', wrangle.elapsed(startedAt)));
        }
        return;
      }

      if (step.kind === 'deploy:failed') {
        spin?.stop();
        print(InfoFmt.pipelineFailure({ phase: 'deploy', error: step.error, at: wrangle.failedAt() }));
        return;
      }

      if (step.kind === 'verify:done') {
        spin?.stop();
        if (result)
          print(InfoFmt.deployResult(result, 'Deploy Result', wrangle.elapsed(startedAt)));
        return;
      }

      if (step.kind === 'verify:failed') {
        spin?.stop();
        print(InfoFmt.pipelineFailure({ phase: 'verify', error: step.error, at: wrangle.failedAt() }));
      }
    });

    life.dispose$.subscribe(() => {
      spin?.stop();
    });

    return Rx.toLifecycle(life, {});
  },
} as const;

const wrangle = {
  elapsed(startedAt?: t.Msecs) {
    return startedAt === undefined ? undefined : (Time.elapsed(startedAt).msec as t.Msecs);
  },

  failedAt() {
    return new Date().toISOString();
  },

  interactive() {
    try {
      return Deno.stdin.isTerminal() && Deno.stdout.isTerminal();
    } catch {
      return false;
    }
  },

  status(args: {
    readonly interactive: boolean;
    readonly spin?: ReturnType<typeof ListenFmt.spinner>;
    readonly text: string;
    readonly set: (next: ReturnType<typeof ListenFmt.spinner> | undefined) => void;
  }) {
    if (!args.interactive) {
      print([args.text]);
      return;
    }

    if (args.spin) {
      args.spin.text = args.text;
      return;
    }

    args.set(ListenFmt.spinner(args.text).start());
  },
} as const;
