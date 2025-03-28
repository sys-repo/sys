import React from 'react';
import { Dev, Signal, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Landing } from './mod.ts';

export default Spec.describe('MyComponent', async (e) => {
  const debug = await createDebugSignals();
  const app = debug.app;
  const d = debug.props;
  const p = app.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      app.listen();
      d.debug.value;
      ctx.host.tracelineColor(p.theme.value === 'Dark' ? 0.15 : -0.06);
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => {
        return <Landing state={app} debug={d.debug.value} />;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
