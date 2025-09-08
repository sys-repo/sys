import { type t, describe, it, expect, Pkg, pkg, expectTypeOf } from './-test.ts';

import type { Crdt } from '@sys/crdt/t';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('API', () => {
    let repo: Crdt.Repo | undefined;
  });
});
