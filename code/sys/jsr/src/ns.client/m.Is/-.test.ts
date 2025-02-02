import { describe, expect, it } from '../../-test.ts';
import { Jsr } from '../m.Jsr/mod.ts';
import { Is } from './mod.ts';

describe('suite', () => {
  it('API', () => {
    expect(Jsr.Is).to.equal(Is);
  });
});
