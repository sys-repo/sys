import { type t, describe, it, expect, expectTypeOf } from '../../-test.ts';
import { parseRootArgs } from '../u.args.ts';

describe('Root Args', () => {
  it('parses -h alias as help=true (no command)', () => {
    const res = parseRootArgs(['-h']);
    expect(res.help).eql(true);
    expect(res.command).eql(undefined);
    expect(res._).eql([]);
  });

  it('extracts command from first positional when valid', () => {
    const res = parseRootArgs(['serve', 'x', 'y']);
    expect(res.command).eql('serve');
    expect(res._).eql(['serve', 'x', 'y']);

    if (res.command) {
      expectTypeOf(res.command).toEqualTypeOf<t.Tools.Command>();
    }
  });

  it('leaves command undefined when first positional is not a tool', () => {
    const res = parseRootArgs(['nope', 'x']);
    expect(res.command).eql(undefined);
    expect(res._).eql(['nope', 'x']);
  });

  it('does not treat flags themselves as commands', () => {
    const res = parseRootArgs(['--help', 'serve']);
    expect(res.help).eql(true);
    expect(res.command).eql('serve');
    expect(res._).eql(['serve']);
  });

  it('binds command when help is present after command', () => {
    const res = parseRootArgs(['serve', '-h']);
    expect(res.help).eql(true);
    expect(res.command).eql('serve');
    expect(res._).eql(['serve']);
  });
});
