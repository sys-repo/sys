import React from 'react';

import { DocumentId } from '@sys/driver-automerge/web/ui';
import { Monaco } from '@sys/driver-monaco';

import { Dev, PathView, Signal, Spec } from '../../-test.ui.ts';
import { MonacoEditor } from '../../ui.MonacoEditor/mod.ts';

import { type t, Color, Crdt, D, Obj } from '../common.ts';
import { createDebugSignals, Debug, STORAGE_KEY } from './-SPEC.Debug.tsx';
import { LoadSplash } from './-ui.LoadSplash.tsx';

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
    const { monaco, editor, doc, path } = v;
    const bus$ = debug.bus$;

    /**
     * Visibility flags:
     */
    const [ready, setReady] = React.useState(false);
    React.useEffect(() => void setReady(false), [doc?.id, Obj.hash(path)]); // NB: restart spinner on doc/path change.
    React.useEffect(() => void setReady((prev) => (!v.render ? false : prev)), [v.render]);

    /**
     * Hook: CRDT data-binding.
     */
    Monaco.Crdt.useBinding({ bus$, monaco, editor, doc, path, foldMarks: true }, (e) => {
      setReady(true);
      console.info(`🧫 [READY] Monaco.Crdt.useBinding`);
      e.$.subscribe((e) => {
        if (e.kind === 'editor:crdt:marks') p.hiddenAreas.value = e.change.after;
        if (e.kind === 'editor:crdt:folding') p.hiddenAreas.value = e.areas;
      });
    });

    /**
     * Render:
     */
    if (!v.doc || !v.render) return <LoadSplash debug={debug} theme={v.theme} />;
    const renderKey = `${v.doc?.id}:${v.path?.join('.')}`;

    return (
      <MonacoEditor
        key={renderKey}
        debug={v.debug}
        theme={v.theme}
        //
        language={v.language}
        autoFocus={true}
        spinning={!ready}
        //
        onMounted={(e) => {
          console.info(`⚡️ MonacoEditor.onReady:`, e);
          p.monaco.value = e.monaco;
          p.editor.value = e.editor;

          if (repo) {
            Monaco.Crdt.Link.enable(e, repo, {
              onCreate: (ev) => console.info('Monaco.Crdt.Link.enable → ⚡️ onCreate:', ev),
              until: e.dispose$,
            });
          }
        }}
      />
    );
  }

  function HostPath() {
    const v = Signal.toObject(p);
    const { monaco, editor, doc, path } = v;
    const bus$ = debug.bus$;

    const yaml = Monaco.Yaml.useYaml({ bus$, monaco, editor, doc, path, errorMarkers: true });
    if (yaml.cursor.path.length === 0) return null;

    return (
      <PathView
        prefix={'Monaco.Dev.PathView:'}
        prefixColor={Color.CYAN}
        path={yaml.cursor.path}
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

    ctx.debug.footer
      .border(-0.1)
      .padding(0)
      .render(() => {
        return (
          <Crdt.UI.Repo.SyncEnabledSwitch
            repo={repo}
            localstorage={STORAGE_KEY.DEV}
            style={{ Padding: [14, 10] }}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
