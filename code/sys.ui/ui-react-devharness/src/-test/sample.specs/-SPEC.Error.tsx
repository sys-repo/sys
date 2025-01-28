import { Spec } from '../common.ts';

export default Spec.describe('Error on initialize', (e) => {
  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    throw new Error('foo');

    ctx.subject
      .size([250, null])
      .display('grid')
      .backgroundColor(1)
      .render((_e) => {
        return <div>{`🐷 Hello`}</div>;
      });
  });
});
