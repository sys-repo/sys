import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Input } from '../../ui.Input/mod.ts';

import { D } from '../common.ts';
import { TextEditor } from '../mod.ts';
import { createDebugSignals, Debug, STORAGE_KEY } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const scroll = p.scroll.value;
      if (scroll) ctx.subject.size('fill');
      else ctx.subject.size('fill-x', 100);
      ctx.redraw();
    };

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      updateSize();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render(() => (
        <TextEditor
          debug={p.debug.value}
          theme={p.theme.value}
          style={{ minHeight: 30 }}
          doc={p.doc.value}
          autoFocus={p.autoFocus.value}
          readOnly={p.readOnly.value}
          scroll={p.scroll.value}
          singleLine={p.singleLine.value}
        />
      ));

    ctx.debug.header
      .padding(0)
      .border(-0.1)
      .render(() => {
        return (
          <Input.DocumentId.View
            buttonStyle={{ margin: 4 }}
            controller={{
              repo,
              signals: { doc: p.doc },
              initial: { text: '' },
              localstorageKey: STORAGE_KEY,
            }}
          />
        );
      });

    // Initialize:
    updateSize();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
