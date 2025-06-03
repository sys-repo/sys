import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { css, D } from '../common.ts';
import { PlayerControls } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;
  const v = debug.video.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const width = debug.props.width.value;
      ctx.subject.size([width, null]);
      ctx.redraw();
    };

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      debug.listen();
      updateSize();
    });

    ctx.subject
      .size()
      .display('grid')
      .render(() => {
        const styles = {
          base: css({ position: 'relative' }),
          mask: css({
            Absolute: [-30, 0, 0, 0],
            backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 0) 100%)`,
            opacity: 0.9,
            zIndex: 0,
          }),
          body: css({
            position: 'relative',
            zIndex: 10,
          }),
        };
        return (
          <div className={styles.base.class}>
            <div className={styles.mask.class} />
            <div className={styles.body.class}>
              <PlayerControls
                debug={p.debug.value}
                theme={p.theme.value}
                playing={v.playing.value}
                muted={v.muted.value}
                onClick={(e) => {
                  console.info(`⚡️ onClick:`, e);
                  if (e.control === 'Play') Signal.toggle(v.playing);
                  if (e.control === 'Mute') Signal.toggle(v.muted);
                }}
              />
            </div>
          </div>
        );
      });

    // Initialize:
    updateSize();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
