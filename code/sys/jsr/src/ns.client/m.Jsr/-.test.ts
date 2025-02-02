import { describe, expect, it } from '../../-test.ts';
import { Fetch } from '../m.Fetch/mod.ts';
import { Jsr } from './mod.ts';
import { Is } from '../m.Jsr/mod.ts';

describe('Jsr (client)', () => {
  it('API', () => {
    expect(Jsr.Fetch).to.equal(Fetch);
    expect(Jsr.Is).to.equal(Is);
  });
});
