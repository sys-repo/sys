import { Crdt, Dev, Signal, Spec } from '../../ui/-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { D } from './common.ts';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    return p.catalog.value?.render() ?? null;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render(() => <Root />);

    ctx.debug.footer
      .border(-0.1)
      .padding(0)
      .render(() => {
        return (
          <Crdt.UI.Repo.SyncEnabledSwitch
            repo={debug.repo}
            localstorage={D.STORAGE_KEY.DEV}
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
