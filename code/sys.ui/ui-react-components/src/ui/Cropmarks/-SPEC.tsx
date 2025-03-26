import { Dev, Signal, Spec, css } from '../-test.ui.ts';
import { Debug } from './-SPEC.Debug.tsx';
import { createDebugSignals } from './-SPEC.signals.tsx';
import { Cropmarks } from './mod.ts';

export default Spec.describe('Cropmarks', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      p.theme.value;
      p.size.value;
      p.subjectOnly.value;
      ctx.redraw();
    });

    const styles = {
      subject: css({
        backgroundColor: 'rgba(255, 0, 0, 0.06)' /* RED */,
        overflow: 'hidden',
        padding: 8,
      }),
    };

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => (
        <Cropmarks theme={p.theme.value} size={p.size.value} subjectOnly={p.subjectOnly.value}>
          <div className={styles.subject.class}>{'🐷 Hello Cropmarks'}</div>
        </Cropmarks>
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
