import { Spec } from '@sys/ui-react-devharness';
import { Foo } from './mod.ts';

export default Spec.describe('Foo', (e) => {
  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.render((e) => {
      return <Foo />;
    });
  });
});
