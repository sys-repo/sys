import { Dev, Spec } from '../../-test.ui.ts';

import { type t, Color, Crdt, css, D, Signal, STORAGE_KEY } from '../common.ts';
import { CanvasProject } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { HostCanvas } from './-ui.Host.Canvas.tsx';
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
        controller={{
          repo: debug.repo,
          signals: { doc: p.doc },
          initial: { count: 0 },
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

    ctx.host.footer
      .padding(0)
      .border(0)
      .render(() => <HostFooter repo={repo} theme={p.theme.value} />);
    ctx.host.layer(1).render(() => <HostCanvas debug={debug} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
