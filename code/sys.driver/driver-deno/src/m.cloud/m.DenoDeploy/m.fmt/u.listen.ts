import { type t, Cli, Rx, Time, c } from './common.ts';
import { InfoFmt } from './u.info.ts';
import { print } from './u.shared.ts';

export const ListenFmt = {
  spinnerText(text: string) {
    return c.italic(c.gray(text));
  },

  stageSpinnerText() {
    return ListenFmt.spinnerText('staging workspace...');
  },

  spinner(text: string) {
    return Cli.spinner(text);
  },

  listen(deployment: t.DenoDeploy.Pipeline.Handle) {
    const life = Rx.abortable();
    let spin: ReturnType<typeof ListenFmt.spinner> | undefined;
    let result: Extract<t.DenoDeploy.Deploy.Result, { readonly ok: true }> | undefined;
    let startedAt: t.Msecs | undefined;
    const verifying = deployment.request.verify?.preview !== false;
    deployment.$.pipe(Rx.takeUntil(life.dispose$)).subscribe((step) => {
      if (step.kind === 'stage:start') {
        startedAt = Time.now.timestamp as t.Msecs;
        print(InfoFmt.deployConfig({ ...deployment.request.config, staging: step.root }));
        const msg = `${ListenFmt.spinnerText('preparing staged root...')}\n${c.gray(c.dim(step.root))}`;
        spin = ListenFmt.spinner(msg).start();
        return;
      }

      if (step.kind === 'build:start') {
        if (spin) spin.text = ListenFmt.spinnerText('building package in source workspace...');
        return;
      }

      if (step.kind === 'build:done' || step.kind === 'stage:materialize:start') {
        if (spin) spin.text = ListenFmt.stageSpinnerText();
        return;
      }

      if (step.kind === 'prepare:done') {
        spin?.stop();
        print(InfoFmt.stagedEntrypoint(step.prepared));
        spin = ListenFmt.spinner(ListenFmt.spinnerText('deploying staged workspace...')).start();
        return;
      }

      if (step.kind === 'verify:start') {
        if (spin) spin.text = ListenFmt.spinnerText('verifying preview...');
        return;
      }

      if (step.kind === 'build:failed') {
        spin?.stop();
        print(InfoFmt.pipelineFailure({ phase: 'build', error: step.error }));
        return;
      }

      if (step.kind === 'stage:materialize:failed') {
        spin?.stop();
        print(InfoFmt.pipelineFailure({ phase: 'stage', error: step.error }));
        return;
      }

      if (step.kind === 'prepare:failed') {
        spin?.stop();
        print(InfoFmt.pipelineFailure({ phase: 'prepare', error: step.error }));
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
        print(InfoFmt.pipelineFailure({ phase: 'deploy', error: step.error }));
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
        print(InfoFmt.pipelineFailure({ phase: 'verify', error: step.error }));
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
} as const;
