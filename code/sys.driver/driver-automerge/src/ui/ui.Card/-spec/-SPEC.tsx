import { Dev, Signal, Spec } from '../../-test.ui.ts';

import { D, DocumentId } from '../common.ts';
import { Card } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

const STORAGE_KEY = `dev:${D.name}.input`;

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  /**
   * Effect: Put repo in global/window namespace (debug console).
   */
  window.repo = repo;

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
          localstorage={STORAGE_KEY}
          repo={repo}
          signals={{ textbox: p.textbox, doc: p.doc }}
        />
      ));

    ctx.debug.header
      .padding(0)
      .border(-0.1)
      .render(() => {
        return (
          <DocumentId.View
            buttonStyle={{ margin: 4 }}
            controller={{
              repo,
              signals: { doc: p.doc, textbox: p.textbox },
              initial: { count: 0 },
              localstorage: STORAGE_KEY,
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
