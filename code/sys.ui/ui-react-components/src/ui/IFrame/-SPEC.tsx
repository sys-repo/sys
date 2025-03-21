import { Dev, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Signal } from './common.ts';
import { IFrame } from './mod.ts';

/**
 * Sample Data.
 */
const SAMPLE = {
  src: 'https://en.wikipedia.org/wiki/World_Wide_Web_Consortium',
  allow: `camera; microphone`,
} as const;

export default Spec.describe('IFrame', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    Dev.Theme.signalEffect(ctx, p.theme);

    Signal.effect(() => {
      p.src.value;
      p.allowFullScreen.value;
      p.loading.value;
      p.sandbox.value;
      ctx.redraw();
    });

    /**
     * Effect: Host Backbground Image
     */
    Signal.effect(() => {
      const showBackground = p.showBackground.value;
      const IMG_HREF = `https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1287&q=80`;
      const url = showBackground ? IMG_HREF : '';
      ctx.host.backgroundImage({ url, opacity: 0.3 });
    });

    /**
     * Render:
     */
    ctx.subject
      .size('fill')
      .display('grid')
      .backgroundColor('')
      .render((e) => {
        return (
          <IFrame
            src={p.src.value}
            allow={SAMPLE.allow}
            onReady={(e) => console.info('⚡️ onReady:', e)}
            onLoad={(e) => console.info('⚡️ onLoad:', e)}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug }} />);
  });
});
