import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Crdt, D, STORAGE_KEY } from '../common.ts';
import { YamlEditorFooter } from '../mod.ts';
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
      .size('fill-x', 150)
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        const repo = v.crdt.repo ? debug.repo : undefined;
        return (
          <YamlEditorFooter
            debug={v.debug}
            theme={v.theme}
            path={v.path}
            visible={v.visible}
            errors={v.errors}
            crdt={{
              repo,
              visible: v.crdt.visible,
              localstorage: STORAGE_KEY.DEV,
            }}
          />
        );
      });

    ctx.debug.footer
      .border(-0.1)
      .padding(0)
      .render(() => {
        return (
          <Crdt.UI.Repo.SyncEnabledSwitch
            repo={repo}
            localstorage={STORAGE_KEY.DEV}
            style={{ Padding: [14, 10] }}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
