import { Cli, Rx, c, type t } from './common.ts';
import { InfoFmt } from './u.info.ts';
import { print } from './u.shared.ts';

export const ListenFmt = {
  spinnerText(text: string) {
    return c.italic(c.gray(text));
  },

  stageSpinnerText(root: string) {
    return `${ListenFmt.spinnerText('staging workspace...')}\n${c.gray(c.dim(root))}`;
  },

  spinner(text: string) {
    return Cli.spinner(text);
  },

  listen(deployment: t.DenoDeploy.Pipeline.Handle) {
    const life = Rx.abortable();
    let spin: ReturnType<typeof ListenFmt.spinner> | undefined;
    let result: Extract<t.DenoDeploy.Deploy.Result, { readonly ok: true }> | undefined;
    const verifying = deployment.request.verify?.preview !== false;
    deployment.$.pipe(Rx.takeUntil(life.dispose$)).subscribe((step) => {
      if (step.kind === 'stage:start') {
        print(InfoFmt.deployConfig(deployment.request.config));
        spin = ListenFmt.spinner(ListenFmt.stageSpinnerText(step.root)).start();
        return;
      }

      if (step.kind === 'prepare:done') {
        spin?.stop();
        print(InfoFmt.stagedEntrypoint(step.prepared));
        spin = ListenFmt.spinner(ListenFmt.spinnerText('deploying staged sample...')).start();
        return;
      }

      if (step.kind === 'verify:start') {
        if (spin) spin.text = ListenFmt.spinnerText('verifying preview...');
        return;
      }

      if (step.kind === 'deploy:done') {
        result = step.result;
        if (!verifying) {
          spin?.stop();
          print(InfoFmt.deployResult(step.result));
        }
        return;
      }

      if (step.kind === 'verify:done') {
        spin?.stop();
        if (result) print(InfoFmt.deployResult(result));
      }
    });

    life.dispose$.subscribe(() => {
      spin?.stop();
    });

    return Rx.toLifecycle(life, {});
  },
} as const;
