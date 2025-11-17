import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Crdt, D, STORAGE_KEY } from '../common.ts';
import { SlugHarness } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const url = debug.url;
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    function update() {
      ctx.debug.width(url.debug !== false ? 400 : 0);
      ctx.redraw();
    }

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        if (!(v.render ?? true)) return null;
        return (
          <SlugHarness
            debug={v.debug}
            theme={v.theme}
            registry={debug.registry}
            crdt={debug.crdt}
            signals={debug.signals}
            path={v.path}
            slugProps={v.slugProps}
            header={v.header}
            sidebar={v.sidebar}
            slugView={v.slugView}
          />
        );
      });

    ctx.debug.footer
      .border(-0.1)
      .padding(0)
      .render(() => {
        return (
          <Crdt.UI.Repo.SyncSwitch
            repo={debug.repo}
            storageKey={STORAGE_KEY.DEV}
            style={{ Padding: [14, 10] }}
          />
        );
      });

    update();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
