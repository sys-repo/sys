import React from 'react';
import { Dev, Signal, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Landing } from './mod.ts';

export default Spec.describe('MyComponent', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.signals.theme, 1);
    Signal.effect(() => {
      p.debug.value;
      p.backgroundVideoOpacity.value;
      p.signals.listen();

      ctx.host.tracelineColor(p.signals.theme.value === 'Dark' ? 0.15 : -0.06);
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => {
        return (
          <Landing
            signals={p.signals}
            debug={p.debug.value}
            backgroundVideoOpacity={p.backgroundVideoOpacity.value}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug }} />);
  });
});
