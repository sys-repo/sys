import { Dev, Signal, Spec } from '../../-test.ui.ts';

import { type t, Color, Crdt, css, D, STORAGE_KEY } from '../common.ts';
import { CanvasProject } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
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
          localstorageKey: STORAGE_KEY.DEV,
        }}
      />
    );
  }

  function Footer(props: { theme?: t.CommonTheme }) {
    const styles = {
      base: css({
        fontSize: 20,
        padding: 20,
      }),
    };
    return <div className={styles.base.class}>Social Lean Canvas: Project</div>;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([550, 420])
      .display('grid')
      .render(() => {
        const theme = Color.theme(p.theme.value);
        const styles = {
          base: css({ position: 'relative', display: 'grid' }),
          docId: css({ Absolute: [-30, 0, null, 0] }),
        };

        return (
          <div className={styles.base.class}>
            <DocumentId style={styles.docId} />
            <CanvasProject debug={p.debug.value} theme={p.theme.value} doc={p.doc.value} />
          </div>
        );
      });

    ctx.debug.header
      .padding(0)
      .border(-0.1)
      .render(() => <DocumentId theme={'Light'} />);

    ctx.debug.footer
      .padding(0)
      .border(-0.1)
      .render(() => <Footer />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
