import { DocumentId } from '@sys/driver-automerge/ui';
import { Monaco } from '@sys/driver-monaco';

import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { MonacoEditor } from '../../ui.MonacoEditor/mod.ts';

import { type t, Color, D } from '../common.ts';
import { useBinding } from '../mod.ts';
import { createDebugSignals, Debug, STORAGE_KEY } from './-SPEC.Debug.tsx';
import { linkInterceptSample } from './-dev.link.ts';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function HostDocumentId(props: t.DocumentIdProps) {
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

  function HostSubject() {
    const v = Signal.toObject(p);

    /**
     * Hook:
     */
    useBinding(v.editor, v.doc, v.path, (e) => {
      p.binding.value = e.binding;
      e.binding.$.subscribe((e) => console.info(`⚡️ editor/crdt:binding.$:`, e));
    });

    /**
     * Render:
     */
    if (!v.doc) return null;
    return (
      <MonacoEditor
        key={`${v.path?.join('.')}`}
        debug={v.debug}
        theme={v.theme}
        //
        language={v.language}
        autoFocus={true}
        //
        onReady={(e) => {
          console.info(`⚡️ MonacoEditor.onReady:`, e);
          p.editor.value = e.editor;
          p.carets.value = e.carets;

          // Cursor path observer:
          const path = Monaco.Yaml.Path.observe(e.editor, e.dispose$);
          path.$.subscribe((e) => (p.selectedPath.value = e.path));

          // Hidden Areas (code-folding) observer:
          const hidden = Monaco.Hidden.observe(e.editor);
          hidden.$.subscribe((e) => (p.hiddenAreas.value = e.areas));

          // (🐷) Custom link intercepts:
          linkInterceptSample(e);
        }}
      />
    );
  }

  function HostPath() {
    const v = Signal.toObject(p);
    if (v.selectedPath.length === 0) return null;
    return (
      <Monaco.Dev.PathView
        prefix={'Monaco.Dev.PathView:'}
        prefixColor={Color.CYAN}
        path={v.selectedPath}
        theme={v.theme}
        style={{ Absolute: [null, 17, -30, 17] }}
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
        return (
          <>
            <HostSubject />
            <HostPath />
          </>
        );
      });

    ctx.host.header.padding(0).render((e) => <HostDocumentId />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
