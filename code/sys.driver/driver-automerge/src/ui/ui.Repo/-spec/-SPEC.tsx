import { Harness, Spec } from '../../-test.ui.ts';
import { D, STORAGE_KEY, Signal } from '../common.ts';
import { Repo } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <Repo.SyncSwitch
        theme={v.theme}
        debug={v.debug}
        //
        repo={v.noRepo ? undefined : debug.repo}
        mode={v.mode}
        storageKey={v.storageKey}
        onChange={(e) => {
          v.redraw += 1;
          console.info(`⚡️ SyncSwitch.onChange:`, e);
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: [420, null], display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          debug.listen();
          ctx.redraw();
        },
      ],
    });

    ctx.debug.footer
      .border(-0.1)
      .padding(10)
      .render(() => {
        return <Repo.SyncSwitch repo={repo} storageKey={STORAGE_KEY.DEV.SUBJECT} />;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
