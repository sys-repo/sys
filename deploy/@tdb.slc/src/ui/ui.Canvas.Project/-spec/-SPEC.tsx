import { Dev, Signal, Spec } from '../../-test.ui.ts';

import { type t, Color, css, Crdt, D } from '../common.ts';
import { CanvasProject } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

const STORAGE_KEY = `dev:${D.name}.slc.crdt`;

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function DocumentId(props: t.DocumentIdProps) {
    const { theme = p.theme.value } = props;
    return (
      <Crdt.UI.DocumentId.View
        {...props}
        theme={theme}
        buttonStyle={{ margin: 4 }}
        controller={{
          repo: debug.repo,
          signals: { doc: p.doc },
          initial: { count: 0 },
          localstorageKey: STORAGE_KEY,
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
            <DocumentId style={styles.docId} background={theme.is.dark ? -0.06 : -0.04} />
            <CanvasProject debug={p.debug.value} theme={p.theme.value} doc={p.doc.value} />
          </div>
        );
      });

    ctx.debug.header
      .padding(0)
      .border(-0.1)
      .render(() => <DocumentId theme={'Light'} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
