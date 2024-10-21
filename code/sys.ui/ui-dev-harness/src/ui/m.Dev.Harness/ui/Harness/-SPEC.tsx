import { Harness } from './mod.ts';
import { Spec } from '../../test.ui';

export default Spec.describe('Harness', (e) => {
  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    const bundle = import('../../test.ui/sample.specs/-SPEC.MySample');

    ctx.subject
      .size('fill')
      .display('flex')
      .render((e) => {
        return (
          <Harness
            //
            style={{ Absolute: 0 }}
            spec={() => bundle}
            // spec={bundle} // NB: This is the same as the line above.
          />
        );
      });
  });
});
