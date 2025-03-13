import { Spec } from '../-test.ui.ts';
import { Panel } from './mod.ts';
import { Debug } from './-SPEC.Debug.tsx';

export default Spec.describe('Panel', (e) => {
  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.size([224, null]).render((e) => {
      return <Panel />;
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{}} />);
  });
});
