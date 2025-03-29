import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { AnimatePresence, css, Color } from './common.ts';
import { MobileSheet } from './mod.ts';

export default Spec.describe('MobileSheet', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([390, 844])
      .display('grid')

      .render((e) => {
        const styles = {
          base: css({ overflow: 'hidden', display: 'grid' }),
          sheet: css({
            marginTop: 40,
            padding: 10,
            // backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
          }),
        };

        const elSheet = (
          <MobileSheet
            style={styles.sheet}
            theme={Color.Theme.invert(p.theme.value)}
            onClick={(e) => {
              e.stopPropagation();
              p.showing.value = false;
            }}
          >
            <div>{'👋 MySheet'}</div>
          </MobileSheet>
        );

        return (
          <div className={styles.base.class} onClick={() => (p.showing.value = true)}>
            <AnimatePresence>{p.showing.value && elSheet}</AnimatePresence>
          </div>
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
