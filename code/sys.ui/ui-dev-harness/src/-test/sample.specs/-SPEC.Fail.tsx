import { Spec, expect } from '../common.ts';

export default Spec.describe('will fail', (e) => {
  e.it('init', () => {
    expect(123).to.eql(456, 'EXPECTED test failure 🐷'); // NB: Will fail.
  });
});
