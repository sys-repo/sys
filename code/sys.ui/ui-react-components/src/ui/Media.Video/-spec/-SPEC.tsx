import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { MediaVideo } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('Media.Video', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const subject = ctx.subject;
      const fit = p.fit.value ?? D.fit;
      if (fit === 'AspectRatio') subject.size('fill-x', 150);
      if (fit === 'Cover' || fit === 'Contain') subject.size('fill');
      ctx.redraw();
    };

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      debug.listen();
      updateSize();
    });

    ctx.subject
      .size([460, 259])
      .display('grid')
      .render(() => {
        return (
          <MediaVideo
            debug={p.debug.value}
            theme={p.theme.value}
            fit={p.fit.value}
            borderRadius={p.borderRadius.value}
            aspectRatio={p.aspectRatio.value}
            onReady={(e) => console.info(`⚡️ onReady:`, e)}
          />
        );
      });

    /**
     * Initial state:
     */
    updateSize();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
