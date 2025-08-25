import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { ValidationErrors } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

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
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <ValidationErrors
            //
            debug={v.debug}
            theme={v.theme}
            title={v.title}
            backbgroundBlur={v.backbgroundBlur}
            errors={debug.errors}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
