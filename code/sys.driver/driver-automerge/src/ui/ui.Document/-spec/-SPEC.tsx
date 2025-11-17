import { Dev, Signal, Spec, Crdt } from '../../-test.ui.ts';
import { css, Color, D, STORAGE_KEY } from '../common.ts';
import { Document } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      ctx.redraw();
    }

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update();
    });

    ctx.subject
      .size([360, null])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return <Document.Info debug={v.debug} theme={v.theme} />;
      });

    ctx.host.header.padding(0).render(() => {
      const v = Signal.toObject(p);
      const theme = Color.theme(v.theme);
      return (
        <Document.Id.View
          theme={v.theme}
          style={{ backgroundColor: Color.alpha(theme.fg, 0.04) }}
          buttonStyle={{ margin: 4 }}
          controller={{
            repo,
            signals: { doc: p.doc },
            storageKey: STORAGE_KEY.DEV,
          }}
        />
      );
    });

    ctx.debug.footer
      .border(-0.1)
      .padding(10)
      .render(() => {
        return <Crdt.UI.Repo.SyncSwitch repo={repo} storageKey={STORAGE_KEY.DEV} />;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
