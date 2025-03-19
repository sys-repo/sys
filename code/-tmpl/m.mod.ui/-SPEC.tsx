import { Dev, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Panel } from './mod.ts';

export default Spec.describe('Panel', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size([224, null])
      .display('grid')
      .render((e) => <Panel theme={p.theme.value} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug }} />);
  });
});
