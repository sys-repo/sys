import { describe, expect, it } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';

describe('cli.crypto args', () => {
  it('parses hash command and preserves positional target path', () => {
    const res = parseArgs(['hash', './foo/bar']);
    expect(res.command).to.eql('hash');
    expect(res._).to.eql(['hash', './foo/bar']);
  });

  it('normalizes hash alias and preserves positional target path', () => {
    const res = parseArgs(['hx', './foo/bar']);
    expect(res.command).to.eql('hash');
    expect(res._).to.eql(['hash', './foo/bar']);
  });

  it('parses --save after hash command', () => {
    const res = parseArgs(['hash', '--save', './foo/bar']);
    expect(res.command).to.eql('hash');
    expect(res.save).to.eql(true);
    expect(res._).to.eql(['hash', './foo/bar']);
  });

  it('parses --save before hash command', () => {
    const res = parseArgs(['--save', 'hash', './foo/bar']);
    expect(res.command).to.eql('hash');
    expect(res.save).to.eql(true);
    expect(res._).to.eql(['hash', './foo/bar']);
  });
});
