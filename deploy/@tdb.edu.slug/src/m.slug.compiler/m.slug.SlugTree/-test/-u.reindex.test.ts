import { describe, expect, it } from '../../-test.ts';
import { SlugTreePure } from '../common.ts';
import { SlugTree } from '../mod.ts';

describe('SlugTree.reindex', () => {
  it('routes through the pure slug-tree implementation', () => {
    expect(SlugTree.reindex).to.equal(SlugTreePure.reindex);
  });
});
