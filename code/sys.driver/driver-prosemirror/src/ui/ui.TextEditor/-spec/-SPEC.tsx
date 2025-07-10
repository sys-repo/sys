import { DocumentId } from '@sys/driver-automerge/ui';
import { Dev, Signal, Spec } from '../../-test.ui.ts';

import { D } from '../common.ts';
import { TextEditor } from '../mod.ts';
import { createDebugSignals, Debug, STORAGE_KEY } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function DebugDocumentId() {
    const doc = p.doc;
    return (
      <DocumentId.View
        buttonStyle={{ margin: 4 }}
        controller={{
          repo,
          signals: { doc },
          initial: { text: '' },
          localstorage: STORAGE_KEY.DEV,
        }}
      />
    );
  }

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
          path={p.path.value}
          autoFocus={p.autoFocus.value}
          readOnly={p.readOnly.value}
          scroll={p.scroll.value}
          singleLine={p.singleLine.value}
        />
      ));

    ctx.debug.header
      .padding(0)
      .border(-0.1)
      .render(() => <DebugDocumentId />);

    // Initialize:
    updateSize();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
