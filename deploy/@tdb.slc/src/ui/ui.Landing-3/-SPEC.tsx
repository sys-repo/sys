import React from 'react';
import { Signal, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { css } from './common.ts';
import { Landing } from './mod.ts';

export default Spec.describe('Landing-3', async (e) => {
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
        const styles = {
          base: css({
            position: 'relative',
            display: 'grid',
            overflow: 'hidden',
          }),
        };

        return (
          <div className={styles.base.class}>
            <Landing state={app} debug={d.debug.value} />
          </div>
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
