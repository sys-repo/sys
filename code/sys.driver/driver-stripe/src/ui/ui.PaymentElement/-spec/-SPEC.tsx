import { css, Dev, Signal, Spec } from '../../-test.ui.ts';
import { PaymentElement } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { readEnv } from './-u.env.ts';
import { D } from './common.ts';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;
  const env = readEnv();

  function Root() {
    const v = Signal.toObject(p);
    return (
      <PaymentElement.UI
        debug={v.debug}
        theme={v.theme}
        publishableKey={v.passSecrets ? env.publishableKey : undefined}
        clientSecret={v.passSecrets ? env.clientSecret : undefined}
        onReady={(element) => console.info(`⚡️ onReady:`, element)}
        onChange={(event) => console.info(`⚡️ onChange:`, event)}
        onLoadError={(error) => console.info(`⚡️ onLoadError`, error)}
      />
    );
  }

  function Pie() {
    const styles = {
      base: css({
        pointerEvents: 'none',
        Absolute: [-10, null, null, 18],
        fontSize: 64,
      }),
    };
    return <div className={styles.base.class}>{'🥧'}</div>;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size([360, null])
      .display('grid')
      .render(() => <Root />);

    ctx.host.layer(-1).render(() => <Pie />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
