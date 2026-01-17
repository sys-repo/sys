import { type t, describe, it, expect, expectTypeOf, Is, Obj, Str } from '../../../-test.ts';

import { TreeHost } from '../mod.ts';
import { SlugClient } from '../common.ts';

describe('TreeSplit', () => {
  it('API', () => {
    expect(TreeHost.Data.Client).to.equal(SlugClient);
  });
});
