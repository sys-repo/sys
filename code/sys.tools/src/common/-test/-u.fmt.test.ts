import { describe, expect, it } from '../../-test.ts';
import { c, Cli } from '../libs.ts';
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

  it('builds help pages via the shared cli help formatter surface', async () => {
    const help = await Fmt.help('sys update', {
      usage: ['sys update [options]'],
      options: [['-h, --help', 'show help']],
    });
    const plain = Cli.stripAnsi(help);

    expect(plain).to.include('sys update');
    expect(plain).to.include('@sys/tools');
    expect(plain).to.include('Usage');
    expect(plain).to.include('Options');
    expect(plain).to.include('show help');
  });

  it('preserves inline ansi styling in shared help notes', async () => {
    const help = await Fmt.help('sys update', {
      note: `@sys/tools/${c.white('update')}`,
    });

    expect(Cli.stripAnsi(help)).to.include('@sys/tools/update');
  });
});
