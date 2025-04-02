import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { AnimatePresence, Color, css } from './common.ts';
import { Sheet } from './mod.ts';

export default Spec.describe('Sheet', (e) => {
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
        const orientation = p.orientation.value;
        const isShowing = p.showing.value;

        const styles = {
          base: css({ overflow: 'hidden', display: 'grid' }),
          sheet: css({ padding: 15, userSelect: 'none' }),
          dim: css({ opacity: 0.3 }),
        };

        const elSheet = isShowing && (
          <Sheet
            theme={Color.Theme.invert(p.theme.value)}
            orientation={orientation}
            edgeMargin={p.edgeMargin.value}
            onMouseDown={(e) => {
              e.stopPropagation();
              p.showing.value = false;
            }}
          >
            <div className={styles.sheet.class}>
              {'👋 MySheet'} — <span className={styles.dim.class}>{'(click to hide)'}</span>
            </div>
          </Sheet>
        );

        return (
          <div className={styles.base.class} onMouseDown={() => (p.showing.value = true)}>
            <AnimatePresence>{elSheet}</AnimatePresence>
          </div>
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
