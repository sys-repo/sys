import { Dev, Signal, Spec } from '../../../../ui/-test.ui.ts';
import { Crdt, D, STORAGE_KEY } from '../common.ts';
import { Sample } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const url = debug.url;
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    function update() {
      ctx.debug.width(url.debug !== false ? 400 : 0);
      ctx.subject.size('fill', p.hostPadding.value ? 50 : 0);
      ctx.redraw();
    }

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update();
    });
    update(); // initial

    ctx.subject.display('grid').render(() => {
      const v = Signal.toObject(p);
      if (!v.render) return null;
      return (
        <Sample
          debug={v.debug}
          theme={v.theme}
          bus$={debug.bus$}
          repo={debug.repo}
          docPath={v.docPath}
          slugPath={v.slugPath}
          signals={debug.signals}
          localstorage={STORAGE_KEY.DEV}
          onDiagnostics={(e) => {
            console.info(`⚡️ onDiagnostics:`, e);
            p.slugDiagnostics.value = e.slugDiagnostics;
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
            repo={debug.repo}
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
