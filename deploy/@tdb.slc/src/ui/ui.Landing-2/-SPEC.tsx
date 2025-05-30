import React from 'react';
import { Dev, Signal, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Landing } from './mod.ts';

export default Spec.describe('Landing-2', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.host.tracelineColor(p.theme.value === 'Dark' ? 0.15 : -0.06);
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => (
        <Landing
          theme={p.theme.value}
          debug={p.debug.value}
          backgroundVideo={p.backgroundVideo.value}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
