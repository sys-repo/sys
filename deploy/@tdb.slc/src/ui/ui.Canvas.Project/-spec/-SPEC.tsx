import { Dev, Spec } from '../../-test.ui.ts';

import { EditorCanvas } from '../../ui.Canvas.Editor/mod.ts';
import { type t, Buttons, Color, Crdt, css, D, Signal, STORAGE_KEY } from '../common.ts';
import { CanvasProject } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
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
    const theme = Color.theme('Light');
    const styles = {
      base: css({ borderTop: `solid 10px ${Color.alpha(theme.fg, 0.08)}` }),
      title: css({ fontSize: 20, padding: 20 }),
    };
    return (
      <div className={styles.base.class}>
        <div className={styles.title.class}>{'Social Lean Canvas: Project'}</div>
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
              onCanvasClick={() => (p.showCanvas.value = true)}
            />
          </div>
        );
      });

    ctx.debug.footer.padding(0).render(() => <DebugFooter />);
    ctx.host.footer.padding(0).render(() => <HostFooter repo={repo} theme={p.theme.value} />);

    ctx.host.layer(1).render(() => {
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
      };

      const doc = v.doc;
      const path = ['project', 'panels'];

      const elCloseButton = (
        <Buttons.Icons.Close
          theme={'Dark'}
          style={{ Absolute: [4, 5, null, null] }}
          onClick={() => (p.showCanvas.value = false)}
        />
      );

      return (
        <div className={styles.base.class}>
          <EditorCanvas
            //
            doc={doc}
            path={path}
            theme={v.theme}
          />
          {elCloseButton}
        </div>
      );
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
