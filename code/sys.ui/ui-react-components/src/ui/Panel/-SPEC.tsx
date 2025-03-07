import { Spec } from '@sys/ui-react-devharness';
import { Panel } from './mod.ts';

export default Spec.describe('Panel', (e) => {
  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.size([224, null]).render((e) => {
      return <Panel />;
    });
  });
});
