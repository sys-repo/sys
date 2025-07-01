import { DocumentId } from '@sys/driver-automerge/ui';
import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { MonacoEditor } from '../../ui.MonacoEditor/mod.ts';

import { D } from '../common.ts';
import { EditorCrdt } from '../mod.ts';
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
        if (!v.doc) return null;

        return (
          <MonacoEditor
            key={`${v.path?.join('.')}`}
            debug={v.debug}
            theme={v.theme}
            autoFocus={true}
            onReady={(e) => {
              /**
               * 🌳 READY:
               */
              console.info(`⚡️ MonacoEditor.onReady:`, e);
              p.editor.value = e.editor;

              // Kill old binding (if it exists).
              p.binding.value?.dispose();
              p.binding.value = undefined;

              // Setup new binding.
              const doc = p.doc.value;
              const path = p.path.value ?? [];

              if (doc) {
                const binding = EditorCrdt.bind(e.editor, doc, path);

                p.binding.value = binding;
                binding.$.subscribe((e) => console.info(`⚡️ editor/crdt:binding.$:`, e));
              }
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
