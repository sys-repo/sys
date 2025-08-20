import { useState } from 'react';
import { clamp } from '../u.ts';

import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { SplitPane } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const { defaultValue = D.defaultValue, min = D.min, max = D.max } = v;

    const [ratioControlled, setRatioControlled] = useState<number>(clamp(defaultValue, min, max));

    return (
      <SplitPane
        debug={v.debug}
        theme={v.theme}
        enabled={v.enabled}
        orientation={v.orientation}
        value={v.isControlled ? ratioControlled : undefined}
        defaultValue={v.defaultValue}
        min={v.min}
        max={v.max}
        gutter={v.gutter}
        //
        onDragStart={(e) => console.info(`⚡️ onDragStart`, e)}
        onDragEnd={(e) => console.info(`⚡️ onDragEnd`, e)}
        onChange={(e) => {
          console.info(`⚡️ onChange`, e);
          setRatioControlled(e.ratio);
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill', 100)
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
