import { Dev, Spec } from '../../-test.ui.ts';
import { D, STORAGE_KEY, Signal } from '../common.ts';
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
      .size([420, null])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <Repo.SyncEnabledSwitch
            theme={v.theme}
            debug={v.debug}
            //
            repo={v.noRepo ? undefined : debug.repo}
            mode={v.mode}
            localstorage={v.localstorage}
            onChange={(e) => {
              v.redraw += 1;
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
