import { describe, expect, it } from '../../-test.ts';
import { Cli } from '../libs.ts';
import { Fmt } from '../u.fmt.ts';

describe('common/Fmt', () => {
  it('formats hash suffix with default length=5', () => {
    const res = Fmt.hashSuffix('sha256-1234567890abcde');
    expect(Cli.stripAnsi(res)).to.eql('#abcde');
  });

  it('formats hash suffix with custom length', () => {
    const res = Fmt.hashSuffix('sha256-1234567890abcde', 3);
    expect(Cli.stripAnsi(res)).to.eql('#cde');
  });
});
