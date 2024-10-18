import { Spec, expect } from '../common';

export default Spec.describe('Error on initialize', (e) => {
  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);

    throw new Error('foo');

    ctx.subject
      .size([250, null])
      .display('grid')
      .backgroundColor(1)
      .render((e) => {
        return <div>{`🐷 Hello`}</div>;
      });
  });
});
