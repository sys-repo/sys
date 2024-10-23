import { describe, expect, it } from './-test.ts';
import { Value } from './common.ts';
import { Str } from './mod.ts';

describe('module: @sys/text', () => {
  it('API', () => {
    expect(Str).to.equal(Value.Str);
  });
});
