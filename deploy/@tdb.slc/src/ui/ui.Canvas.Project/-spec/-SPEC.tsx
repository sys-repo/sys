import { Dev, Spec } from '../../-test.ui.ts';
import { EditorCanvas } from '../../ui.Canvas.Editor/mod.ts';

import { type t, Buttons, Color, Crdt, css, D, Is, Obj, Signal, STORAGE_KEY } from '../common.ts';
import { CanvasProject } from '../mod.ts';
import { createDebugSignals, Debug, PATHS } from './-SPEC.Debug.tsx';
import { HostFooter } from './-ui.HostFooter.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function DocumentId(props: t.DocumentIdProps) {
    const theme = Color.theme(p.theme.value);
    return (
      <Crdt.UI.DocumentId.View
        background={theme.is.dark ? -0.06 : -0.04}
        theme={theme.name}
        buttonStyle={{ margin: 4 }}
        {...props}
        controller={{
          repo: debug.repo,
          signals: { doc: p.doc },
          initial: { count: 0 },
          localstorage: STORAGE_KEY.DEV,
        }}
      />
    );
  }

  function DebugFooter() {
    const theme = Color.theme(p.theme.value);
    const styles = {
      base: css({
        borderTop: `solid 1px ${Color.alpha(theme.fg, theme.is.dark ? 1 : 0.15)}`,
        color: theme.fg,
        backgroundColor: theme.bg,
      }),
      title: css({ fontSize: 20, padding: 20 }),
    };

    const doc = p.doc.value;
    const obj = Obj.Path.get(doc?.current, PATHS.YAML_PARSED, {});
    const title = String(Is.record(obj) ? obj.name : 'Untitled');

    // Signal.useRedrawEffect()
    Crdt.UI.useRedrawEffect(doc);

    return (
      <div className={styles.base.class}>
        <div className={styles.title.class}>{title}</div>
      </div>
    );
  }

  function HostCanvas() {
    if (!p.showCanvas.value) return null;

    const v = Signal.toObject(p);
    const theme = Color.theme(v.theme);
    const styles = {
      base: css({
        position: 'relative',
        backgroundColor: theme.bg,
        display: 'grid',
        padding: 60,
        pointerEvents: 'auto',
      }),
      canvas: css({
        backgroundColor: theme.bg,
        boxShadow: `0 0 65px 5px ${Color.format(-0.08)}`,
      }),
    };

    const doc = v.doc;
    const path = ['project', 'panels'];

    const elCloseButton = (
      <Buttons.Icons.Close
        theme={theme.name}
        style={{ Absolute: [4, 5, null, null] }}
        onClick={() => {
          p.showCanvas.value = false;
          p.redraw.value++;
        }}
      />
    );

    return (
      <div className={styles.base.class}>
        <EditorCanvas
          //
          doc={doc}
          path={path}
          theme={v.theme}
          style={styles.canvas}
        />
        {elCloseButton}
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });
    Signal.effect(() => {
      const showing = p.showEditorPanel.value;
      ctx.debug.padding(showing ? 0 : 15).scroll(!showing);
    });

    ctx.subject
      .size([550, 420])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        const styles = {
          base: css({ position: 'relative', display: 'grid' }),
          docId: css({ Absolute: [-30, 0, null, 0] }),
        };

        return (
          <div className={styles.base.class}>
            <DocumentId style={styles.docId} />
            <CanvasProject
              debug={v.debug}
              theme={v.theme}
              doc={v.doc}
              video={v.video}
              onCanvasClick={() => {
                p.showCanvas.value = true;
                p.showEditorPanel.value = true;
              }}
            />
          </div>
        );
      });

    ctx.debug.footer.padding(0).render(() => <DebugFooter />);
    ctx.host.footer
      .padding(0)
      .border(0)
      .render(() => <HostFooter repo={repo} theme={p.theme.value} />);
    ctx.host.layer(1).render(() => <HostCanvas />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
