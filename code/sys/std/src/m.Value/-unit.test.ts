import { describe, expect, it } from '../-test.ts';
import { ArrayLib } from '../m.Value.Array/mod.ts';
import { Value } from './mod.ts';

describe('Value', () => {
  it('API', () => {
    expect(Value.Array).to.equal(ArrayLib);
  });
});
