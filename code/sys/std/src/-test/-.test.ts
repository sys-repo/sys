import { Pkg } from '../mod.ts';
import { describe, expect, it, pkg } from '../-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('API: @sys/std/value', async () => {
    const Std = await import('@sys/std');
    const Value = await import('@sys/std/value');

    expect(Value.Is).to.equal(Std.Is);
    expect(Value.Arr).to.equal(Std.Arr);
    expect(Value.Num).to.equal(Std.Num);
    expect(Value.Obj).to.equal(Std.Obj);
    expect(Value.Str).to.equal(Std.Str);
    expect(Value.Str.Lorem).to.equal(Value.Lorem);
  });
});
