import { type t, describe, it, expect, expectTypeOf, Is, Obj, Str } from '../../../-test.ts';

import { LayoutTreeSplit } from '../mod.ts';
import { SlugClient } from '../common.ts';

describe('TreeSplit', () => {
  it('API', () => {
    expect(LayoutTreeSplit.Data.Client).to.equal(SlugClient);
  });
});
