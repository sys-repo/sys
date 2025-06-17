import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { Card } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

import type * as t from './-t.ts';

/**
 * Add the repo to the global window object so
 * it can be accessed in the browser console.
 */
declare global {
  interface Window {
    repo: t.CrdtRepo;
  }
}

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
          repo={p.repo.value}
          signals={{ docId: p.docId, doc: p.doc }}
          sync={{
            url: p.syncUrl.value,
            enabled: p.syncEnabled.value,
          }}
          // ⚡️ Handlers:
          onDocIdTextChange={(e) => (p.docId.value = e.value)}
          onActionClick={() => {
            const repo = p.repo.value;
            const next = repo?.create<t.TDoc>({ count: 0, text: '' });
            console.info('⚡️ created → doc:', next);
            p.docId.value = next?.id;
          }}
          onSyncEnabledChange={(e) => (p.syncEnabled.value = e.enabled)}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
