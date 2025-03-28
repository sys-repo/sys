import React from 'react';
import { Signal, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Landing } from './mod.ts';

export default Spec.describe('MyComponent', async (e) => {
  const debug = await createDebugSignals();
  const app = debug.app;
  const d = debug.props;
  const p = app.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Signal.effect(() => {
      app.listen();
      d.debug.value;
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
