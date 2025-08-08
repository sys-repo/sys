import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Monaco } from '../../mod.ts';
import { D } from '../common.ts';
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
            onDocumentChange={(e) => (p.doc.value = e.doc)}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
