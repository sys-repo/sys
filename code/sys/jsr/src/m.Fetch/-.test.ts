import { describe, expect, it } from '../-test.ts';
import { Jsr } from '../m.Jsr/mod.ts';
import { Url } from './common.ts';
import { Fetch } from './mod.ts';

describe('Jsr.Fetch', () => {
  it('API', () => {
    expect(Jsr.Fetch).to.equal(Fetch);
    expect(Fetch.Url).to.equal(Url);
  });
});
