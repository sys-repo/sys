import { expect } from '../../../-test.ts';
import { Test } from '../../mod.ts';

export default Test.describe('Two', (e) => {
  e.it('two.foo', () => {
    expect(123).to.eql(123);
  });
});
