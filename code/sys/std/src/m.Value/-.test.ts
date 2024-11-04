import { describe, expect, it } from '../-test.ts';
import { ArrayLib } from '../m.Value.Array/m.Array.ts';
import { Num, Value, isObject } from './mod.ts';

describe('Value', () => {
  it('API', () => {
    expect(Value.Array).to.equal(ArrayLib);
    expect(Value.Num).to.equal(Num);
    expect(Value.round).to.equal(Num.round);
    expect(Value.isObject).to.equal(isObject);
  });
});
