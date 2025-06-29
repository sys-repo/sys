import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { type t, D, Crdt, STORAGE_KEY } from '../common.ts';
import { Repo } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([380, null])
      .display('grid')
      .render(() => {
        return (
          <Repo.SyncEnabledSwitch
            theme={p.theme.value}
            debug={p.debug.value}
            //
            repo={p.noRepo.value ? undefined : debug.repo}
            localstorage={p.localstorage.value}
            onChange={(e) => {
              p.redraw.value++;
              console.info(`⚡️ SyncEnabledSwitch.onChange:`, e);
            }}
          />
        );
      });

    ctx.debug.footer
      .border(-0.1)
      .padding(10)
      .render(() => {
        return <Repo.SyncEnabledSwitch repo={repo} localstorage={STORAGE_KEY.DEV.SUBJECT} />;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
