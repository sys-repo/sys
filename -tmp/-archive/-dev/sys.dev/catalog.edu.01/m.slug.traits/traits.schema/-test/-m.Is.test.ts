import { describe, expect, it } from '../../../-test.ts';
import { Slug } from '../common.ts';
import { Is, Traits } from '../mod.ts';

describe('Slug.Is', () => {
  /**
   * Note: test cases for each `Is.<trait-method>` are within each
   *       trait's specific test file.
   */
  it('API', () => {
    expect(Traits.Is).to.equal(Is);
    expect(Traits.Is.slugTreeProps).to.equal(Slug.Tree.Is.props);
  });
});
