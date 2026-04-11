import { describe, it, expect, expectTypeOf } from '../../-test.ts';
import type { t } from '../common.ts';
import { parseArgs } from '../u.args.ts';

describe('Root Args', () => {
  it('parses -h alias as help=true (no command)', () => {
    const res = parseArgs(['-h']);
    expect(res.help).eql(true);
    expect(res.command).eql(undefined);
    expect(res._).eql([]);
  });

  it('extracts command from first positional when valid', () => {
    const res = parseArgs(['serve', 'x', 'y']);
    expect(res.command).eql('serve');
    expect(res._).eql(['serve', 'x', 'y']);

    if (res.command) {
      expectTypeOf(res.command).toEqualTypeOf<t.Root.Command>();
    }
  });

  it('normalizes agent alias to the fn command', () => {
    const res = parseArgs(['agent', 'x']);
    expect(res.command).eql('fn');
    expect(res._).eql(['fn', 'x']);
  });

  it('keeps the fn command as canonical', () => {
    const res = parseArgs(['fn', 'x']);
    expect(res.command).eql('fn');
    expect(res._).eql(['fn', 'x']);
  });

  it('normalizes branded alias to the fn command', () => {
    const res = parseArgs(['ƒ', 'x']);
    expect(res.command).eql('fn');
    expect(res._).eql(['fn', 'x']);
  });

  it('normalizes short hidden alias to the fn command', () => {
    const res = parseArgs(['f', 'x']);
    expect(res.command).eql('fn');
    expect(res._).eql(['fn', 'x']);
  });

  it('does not accept removed code alias', () => {
    const res = parseArgs(['code', 'x']);
    expect(res.command).eql(undefined);
    expect(res._).eql(['code', 'x']);
  });

  it('leaves command undefined when first positional is not a tool', () => {
    const res = parseArgs(['nope', 'x']);
    expect(res.command).eql(undefined);
    expect(res._).eql(['nope', 'x']);
  });

  it('does not treat flags themselves as commands', () => {
    const res = parseArgs(['--help', 'serve']);
    expect(res.help).eql(true);
    expect(res.command).eql('serve');
    expect(res._).eql(['serve']);
  });

  it('binds command when help is present after command', () => {
    const res = parseArgs(['serve', '-h']);
    expect(res.help).eql(true);
    expect(res.command).eql('serve');
    expect(res._).eql(['serve']);
  });
});
