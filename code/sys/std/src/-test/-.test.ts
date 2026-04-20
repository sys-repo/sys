import { Pkg } from '../-exports/-pkg.ts';
import { describe, expect, it, pkg } from '../-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('API: root stays lean and excludes leaf-owned exports', async () => {
    const Std = await import('@sys/std');
    const Value = await import('@sys/std/value');
    const Time = await import('@sys/std/time');
    const Log = await import('@sys/std/log');

    expect(Std.Try).to.be.an('object');
    expect(Std.Try.run).to.be.a('function');
    expect(Std.Lazy).to.be.an('object');

    expect('Arr' in Std).to.eql(false);
    expect('Num' in Std).to.eql(false);
    expect('Obj' in Std).to.eql(false);
    expect('Str' in Std).to.eql(false);
    expect('Is' in Std).to.eql(false);
    expect('Time' in Std).to.eql(false);
    expect('Log' in Std).to.eql(false);

    expect(Value.Str.Lorem).to.equal(Value.Lorem);
    expect(Time.Time).to.be.an('object');
    expect(Log.Log).to.be.an('object');
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
