import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { css, D } from './common.ts';
import { ProseMarkdown } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Sample } from './-ui.Sample.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const renderers = Sample.renderersFor(v.sample, v.theme);
    const isScroll = v.viewport === 'scroll';
    const styles = {
      base: css({
        position: 'relative',
        width: 450,
      }),
      body: css({
        Absolute: isScroll ? 0 : undefined,
        Scroll: isScroll ? true : undefined,
      }),
    };

    return (
      <div className={styles.base.class}>
        <div className={styles.body.class}>
          <ProseMarkdown.UI
            debug={v.debug}
            theme={v.theme}
            value={v.value}
            renderers={renderers}
          />
        </div>
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      if (p.viewport.value === 'scroll') ctx.subject.size('fill-y');
      else ctx.subject.size([450, null]);
      ctx.redraw();
    }

    Signal.effect(update);
    Harness.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
