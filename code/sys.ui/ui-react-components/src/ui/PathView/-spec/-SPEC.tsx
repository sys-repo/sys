import { type t, Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { PathView } from '../mod.ts';
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
      .size()
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        const onClick: t.PathViewClickHandler = (e) => {
          console.info('⚡️ PathView.onClick:', e);
          console.info('                   :.path:', e.path);
        };
        return (
          <PathView
            debug={v.debug}
            theme={v.theme}
            path={v.path}
            prefix={v.prefix}
            onClick={v.debugClickHandler ? onClick : undefined}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
