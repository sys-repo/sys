import { type t, describe, it, expect, Testing } from '../../../-test.ts';

import { Cache } from '../mod.ts';
import { CacheCmd } from '../m.CacheCmd.ts';

describe('Http.Cache.Cmd', () => {
  it('API', () => {
    expect(Cache.Cmd).to.equal(CacheCmd);
  });
});
