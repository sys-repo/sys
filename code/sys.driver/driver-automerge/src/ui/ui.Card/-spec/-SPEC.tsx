import { Dev, Signal, Spec } from '../../-test.ui.ts';

import { D, DocumentId } from '../common.ts';
import { Card } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

const STORAGE_KEY = `dev:${D.name}.input`;

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  /**
   * Effect: Put repo in global/window namespace (debug console).
   */
  Signal.effect(() => void (window.repo = p.repo.value!));

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([520, 350])
      .display('grid')
      .render(() => (
        <Card
          debug={p.debug.value}
          theme={p.theme.value}
          headerStyle={{ topOffset: -29 }}
          localstorageKey={STORAGE_KEY}
          syncUrl={p.syncUrl.value}
          factory={debug.factory}
          signals={{
            docId: p.docId,
            doc: p.doc,
            repo: p.repo,
            syncEnabled: p.syncEnabled,
          }}
        />
      ));

    ctx.debug.header
      .padding(0)
      .border(-0.1)
      .render(() => {
        const repo = p.repo.value;
        return (
          <DocumentId.View
            buttonStyle={{ margin: 4 }}
            controller={{
              repo,
              signals: { doc: p.doc, docId: p.docId },
              initial: { count: 0 },
              localstorageKey: STORAGE_KEY,
            }}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
