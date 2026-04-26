import { Pkg } from '../-exports/-pkg.ts';
import { describe, expect, it, pkg } from '../-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('API: root stays lean and dedicated leaves remain authoritative', async () => {
    const Std = await import('@sys/std');
    const Dispose = await import('@sys/std/dispose');
    const Fn = await import('@sys/std/fn');
    const History = await import('@sys/std/history');
    const Is = await import('@sys/std/is');
    const Lazy = await import('@sys/std/lazy');
    const Log = await import('@sys/std/log');
    const Num = await import('@sys/std/num');
    const Obj = await import('@sys/std/obj');
    const ObjPath = await import('@sys/std/obj/path');
    const Regex = await import('@sys/std/regex');
    const Str = await import('@sys/std/str');
    const Time = await import('@sys/std/time');
    const Try = await import('@sys/std/try');

    expect('Arr' in Std).to.eql(false);
    expect('Dispose' in Std).to.eql(false);
    expect('Fn' in Std).to.eql(false);
    expect('History' in Std).to.eql(false);
    expect('Is' in Std).to.eql(false);
    expect('Lazy' in Std).to.eql(false);
    expect('Log' in Std).to.eql(false);
    expect('Num' in Std).to.eql(false);
    expect('Obj' in Std).to.eql(false);
    expect('Regex' in Std).to.eql(false);
    expect('Str' in Std).to.eql(false);
    expect('Time' in Std).to.eql(false);
    expect('Try' in Std).to.eql(false);

    expect(Dispose.Dispose).to.be.an('object');
    expect(Fn.Fn).to.be.an('object');
    expect(History.History).to.be.an('object');
    expect(Lazy.Lazy).to.be.an('object');
    expect(Regex.Regex).to.be.an('object');
    expect(Try.Try.run).to.be.a('function');
    expect(Num.Num).to.be.an('object');
    expect(Str.Str).to.be.an('object');
    expect(Str.Str.Lorem).to.equal(Str.Lorem);
    expect(Is.Is.object).to.equal(Is.isObject);
    expect(Is.Is.record).to.equal(Is.isRecord);
    expect(Is.Is.emptyRecord).to.equal(Is.isEmptyRecord);
    expect(ObjPath.Path).to.equal(Obj.Obj.Path);
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

  it('API: Try and Err subpaths co-exist without circular init drift', async () => {
    const { Try } = await import('@sys/std/try');
    const { Err } = await import('@sys/std/error');

    const runResult = Try.run((): string => {
      throw 'boom';
    });
    const result = runResult.result;

    expect(Err.Try).to.equal(Try);
    expect(result.ok).to.eql(false);
    if (!result.ok) {
      expect(result.error).to.be.instanceOf(Error);
      expect(result.error.message).to.eql('boom');
    }
  });
});
