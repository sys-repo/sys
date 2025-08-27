import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

import { Factory, regs, useFactory, ValidationErrors } from './-u.ts';

export default Spec.describe(D.displayName, async (e) => {
  const factory = Factory.make(regs);
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const plan = p.plan.value;
    const catalog = useFactory(factory, plan, { strategy: 'eager', validate: false });
    const { issues, element } = catalog;
    return catalog.ok ? element : <ValidationErrors errors={issues.validation} />;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([620, 350])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
