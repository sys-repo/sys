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

  it('API: ANSI stays on the dedicated subpath', async () => {
    const Std = await import('@sys/std');
    const Ansi = await import('@sys/std/ansi/server');

    expect('c' in Std).to.eql(false);
    expect('stripAnsi' in Std).to.eql(false);

    expect(Ansi.c).to.equal(Ansi.colors);
    expect(Ansi.c.green).to.be.a('function');
    expect(Ansi.colors).to.equal(Ansi.c);
    expect(Ansi.stripAnsi).to.be.a('function');
  });
});
