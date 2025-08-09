import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Monaco } from '../../mod.ts';
import { Crdt, D, STORAGE_KEY } from '../common.ts';
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
      .size('fill', 100)
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <Monaco.Yaml.Editor
            repo={repo}
            documentId={v.documentId}
            editor={v.editor}
            footer={v.footer}
            path={v.path}
            debug={v.debug}
            theme={v.theme}
            onReady={(e) => console.info(`⚡️ onReady:`, e)}
            onDocumentLoaded={(e) => (p.doc.value = e.doc)}
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
