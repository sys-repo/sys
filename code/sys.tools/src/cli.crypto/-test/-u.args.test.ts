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
});
