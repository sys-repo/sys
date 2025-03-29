import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { AnimatePresence, css, Color } from './common.ts';
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
        const styles = {
          base: css({ overflow: 'hidden', display: 'grid' }),
          sheet: css({ marginTop: 40, padding: 15, userSelect: 'none' }),
        };

        const elSheet = (
          <Sheet
            style={styles.sheet}
            theme={Color.Theme.invert(p.theme.value)}
            onMouseDown={(e) => {
              e.stopPropagation();
              p.showing.value = false;
            }}
          >
            <div>{'👋 MySheet — (click anywhere to hide)'}</div>
          </Sheet>
        );

        return (
          <div className={styles.base.class} onMouseDown={() => (p.showing.value = true)}>
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
