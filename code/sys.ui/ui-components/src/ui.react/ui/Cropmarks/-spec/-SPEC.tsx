import { css, Harness, Spec } from '../../-test.ui.ts';
import { Cropmarks } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe('Cropmarks', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const styles = {
      subject: css({
        backgroundColor: 'rgba(255, 0, 0, 0.06)', /* RED */
        overflow: 'hidden',
        padding: 8,
      }),
    };

    return (
      <Cropmarks theme={p.theme.value} size={p.size.value} subjectOnly={p.subjectOnly.value}>
        <div className={styles.subject.class}>{'🐷 Hello Cropmarks'}</div>
      </Cropmarks>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { size: 'fill', display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          debug.listen();
          ctx.redraw();
        },
      ],
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
