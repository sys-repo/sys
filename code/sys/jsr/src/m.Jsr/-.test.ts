import { describe, expect, it } from '../-test.ts';
import { Fetch } from '../m.Jsr.Fetch/mod.ts';
import { Jsr } from './mod.ts';

describe('Jsr', () => {
  it('API', () => {
    expect(Jsr.Fetch).to.equal(Fetch);
  });
});
