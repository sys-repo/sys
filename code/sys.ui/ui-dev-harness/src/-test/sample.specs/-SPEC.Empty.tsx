import { Spec } from '../common.ts';

export default Spec.describe('Empty', (e) => {
  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    // ctx.host.backgroundColor(-0.3);
    // ctx.subject.backgroundColor(-0.9);
  });
});
