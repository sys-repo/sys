import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { Sample } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

import type * as t from './-t.ts';

// Add the repo to the global window object so it can be accessed in the browser console.
declare global {
  interface Window {
    repo: t.CrdtRepo;
  }
}

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;
  window.repo = debug.repo;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([460, 350])
      .display('grid')
      .render(() => (
        <Sample
          //
          debug={p.debug.value}
          theme={p.theme.value}
          doc={p.doc.value}
          repo={debug.repo}
          syncUrl={debug.wss}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
