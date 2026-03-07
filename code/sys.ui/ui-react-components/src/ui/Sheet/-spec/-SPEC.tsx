import { Dev, Spec } from '../../-test.ui.ts';
import { AnimatePresence, Color, css, Signal } from '../common.ts';
import { Sheet } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('Sheet', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const orientation = v.orientation;
    const isShowing = v.showing;
    const styles = {
      base: css({ overflow: 'hidden', display: 'grid' }),
      sheet: css({ padding: 15, userSelect: 'none' }),
      dim: css({ opacity: 0.3 }),
    };

    const elSheet = isShowing && (
      <Sheet.UI
        theme={Color.Theme.invert(v.theme)}
        orientation={orientation}
        edgeMargin={v.edgeMargin}
        onMouseDown={(e) => {
          e.stopPropagation();
          v.showing = false;
        }}
      >
        <div className={styles.sheet.class}>
          {'👋 MySheet'} — <span className={styles.dim.class}>{'(click to hide)'}</span>
        </div>
      </Sheet.UI>
    );

    return (
      <div className={styles.base.class} onMouseDown={() => (v.showing = true)}>
        <AnimatePresence>{elSheet}</AnimatePresence>
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

    ctx.subject
      .size([390, 844])
      .display('grid')
      .render((e) => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
