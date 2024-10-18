import { Spec, expect } from '../common';

export default Spec.describe('will fail', (e) => {
  e.it('init', async (e) => {
    expect(123).to.eql(456, 'EXPECTED test failure 🐷'); // NB: Will fail.
  });
});
