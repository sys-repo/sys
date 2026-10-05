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

  it('builds the canonical published invocation command', () => {
    expect(Fmt.invoke('deploy')).to.eql('deno run -A jsr:@sys/tools deploy');
  });

  it('formats menu back affordances with a cyan arrow', () => {
    const res = Fmt.back({ indent: '  ' });
    expect(res).to.contain(c.cyan('←'));
    expect(Cli.stripAnsi(res)).to.eql('  ← back');
  });

  it('builds help pages via the shared cli help formatter surface', async () => {
    const help = await Fmt.help('sys upgrade', {
      usage: ['sys upgrade [options]'],
      options: [['-h, --help', 'show help']],
    });
    const plain = Cli.stripAnsi(help);

    expect(plain).to.include('sys upgrade');
    expect(plain).to.include('@sys/tools');
    expect(plain).to.include('Usage');
    expect(plain).to.include('Options');
    expect(plain).to.include('show help');
  });

  it('preserves inline ansi styling in shared help notes', async () => {
    const help = await Fmt.help('sys upgrade', {
      note: `@sys/tools/${c.white('upgrade')}`,
    });

    expect(Cli.stripAnsi(help)).to.include('@sys/tools/upgrade');
  });
});
