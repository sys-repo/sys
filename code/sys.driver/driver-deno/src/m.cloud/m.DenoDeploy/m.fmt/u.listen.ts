import { Cli, Rx, c, type t } from './common.ts';
import { InfoFmt } from './u.info.ts';
import { print } from './u.shared.ts';

export const ListenFmt = {
  spinnerText(text: string) {
    return c.italic(c.gray(text));
  },

  spinner(text: string) {
    return Cli.spinner(ListenFmt.spinnerText(text));
  },

  listen(deployment: t.DenoDeploy.Pipeline.Handle) {
    const life = Rx.abortable();
    let spin: ReturnType<typeof ListenFmt.spinner> | undefined;
    deployment.$.pipe(Rx.takeUntil(life.dispose$)).subscribe((step) => {
      if (step.kind === 'stage:start') {
        print(InfoFmt.deployConfig(deployment.request.config));
        spin = ListenFmt.spinner('staging workspace...').start();
        return;
      }

      if (step.kind === 'prepare:done') {
        spin?.stop();
        print(InfoFmt.stagedEntrypoint(step.prepared));
        spin = ListenFmt.spinner('deploying staged sample...').start();
        return;
      }

      if (step.kind === 'verify:start') {
        if (spin) spin.text = ListenFmt.spinnerText('verifying preview...');
        return;
      }

      if (step.kind === 'deploy:done') {
        spin?.stop();
        print(InfoFmt.deployResult(step.result));
      }
    });

    life.dispose$.subscribe(() => {
      spin?.stop();
    });

    return Rx.toLifecycle(life, {});
  },
} as const;
