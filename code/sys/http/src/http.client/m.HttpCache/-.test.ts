import { type t, describe, it, expect, Testing } from '../../-test.ts';

import { Cache } from './mod.ts';
import { Http } from '../mod.ts';

describe('Http.Cache', () => {
  it('API', () => {
    expect(Http.Cache).to.equal(Cache);
  });
});
