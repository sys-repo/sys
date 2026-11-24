import { Harness, Signal, Spec, type t } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { PathView } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  const onClick: t.PathViewClickHandler = (e) => {
    console.info('⚡️ PathView.onClick:', e);
    console.info('                   :.path:', e.path);
  };

  function Root() {
    const v = Signal.toObject(p);
    return (
      <PathView
        debug={v.debug}
        theme={v.theme}
        path={v.path}
        prefix={v.prefix}
        onClick={v.debugClickHandler ? onClick : undefined}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: undefined, display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          debug.listen();
          ctx.redraw();
        },
      ],
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
