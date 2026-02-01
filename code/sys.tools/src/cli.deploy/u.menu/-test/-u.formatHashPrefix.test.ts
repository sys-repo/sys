import { Cli, describe, expect, it } from '../../../-test.ts';
import { formatHashPrefix } from '../u/u.formatHashPrefix.ts';

describe('Deploy: formatHashPrefix', () => {
  it('formats digest suffix', () => {
    const res = formatHashPrefix('abcde');
    expect(Cli.stripAnsi(res)).to.eql('#abcde');
  });

  it('defaults to placeholder', () => {
    const res = formatHashPrefix();
    expect(Cli.stripAnsi(res).trim()).to.eql('#');
  });
});
