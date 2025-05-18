import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { LogoWordmark } from './mod.ts';

export default Spec.describe('Logo.Wordmark', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const width = p.width.value;
      if (width === undefined) ctx.subject.size('fill-x', 180);
      else ctx.subject.size([width, null]);
    };

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      debug.listen();
      updateSize();
      ctx.redraw();
    });

    ctx.subject
      .size()
      .display('grid')
      .render((e) => (
        <LogoWordmark
          theme={p.theme.value}
          logo={p.logo.value}
          onReady={() => console.info(`⚡️ onReady`)}
        />
      ));

    updateSize();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
