import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { DocumentId } from '@sys/driver-automerge/ui';
import { MonacoEditor } from '../../ui.MonacoEditor/mod.ts';

import { D } from '../common.ts';
import { Debug, createDebugSignals, STORAGE_KEY } from './-SPEC.Debug.tsx';

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

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill', 150)
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <MonacoEditor
            debug={v.debug}
            theme={v.theme}
            onReady={(e) => {
              console.info(`⚡️ MonacoEditor.onReady:`, e);
              p.editor.value = e.editor;
            }}
          />
        );
      });

    ctx.debug.header
      .padding(0)
      .border(-0.1)
      .render(() => <DebugDocumentId />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
