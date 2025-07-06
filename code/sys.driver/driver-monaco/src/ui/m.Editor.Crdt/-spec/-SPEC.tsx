import { DocumentId } from '@sys/driver-automerge/ui';
import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { MonacoEditor } from '../../ui.MonacoEditor/mod.ts';

import { type t, Color, D } from '../common.ts';
import { EditorCrdt } from '../mod.ts';
import { createDebugSignals, Debug, STORAGE_KEY } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function DebugDocumentId(props: t.DocumentIdProps) {
    const doc = p.doc;
    const theme = Color.theme(p.theme.value);
    return (
      <DocumentId.View
        background={theme.is.dark ? -0.06 : -0.04}
        theme={theme.name}
        buttonStyle={{ margin: 4 }}
        controller={{
          repo,
          signals: { doc },
          initial: { text: '' },
          localstorage: STORAGE_KEY.DEV,
        }}
        {...props}
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

        const elEditor = v.doc && (
          <MonacoEditor
            key={`${v.path?.join('.')}`}
            debug={v.debug}
            theme={v.theme}
            language={v.language}
            autoFocus={true}
            onReady={async (e) => {
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
                const binding = await EditorCrdt.bind(e.editor, doc, path);

                p.binding.value = binding;
                binding.$.subscribe((e) => console.info(`⚡️ editor/crdt:binding.$:`, e));
              }
            }}
          />
        );

        return (
          <>
            <DebugDocumentId style={{ Absolute: [-29, 0, null, 0] }} />
            {elEditor}
            {/* <DebugDocumentId style={{ Absolute: [null, 0, -29, 0] }} /> */}
          </>
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
