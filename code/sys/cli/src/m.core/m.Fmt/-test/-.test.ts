import { c, describe, expect, it } from '../../../-test.ts';
import { Cli, Fmt } from '../../mod.ts';

describe('Cli.Fmt', () => {
  it('API', async () => {
    const m = await import('@sys/cli/fmt');
    expect(m.Fmt).to.equal(Fmt);
    expect(m.Fmt).to.equal(Cli.Fmt);
  });

  it('formats spinner text consistently', () => {
    expect(Cli.Fmt.spinnerText('working...')).to.eql(Fmt.spinnerText('working...'));
  });

  it('supports explicit spinner spacing control', () => {
    const text = c.gray(c.italic('working...'));

    expect(Cli.Fmt.spinnerText('working...', false)).to.eql(text);
    expect(Cli.Fmt.spinnerText('working...', true)).to.eql(`${text}\n`);
    expect(Cli.Fmt.spinnerText('working...', 2)).to.eql(`\n\n${text}\n\n`);
    expect(Cli.Fmt.spinnerText('working...', [1, 2])).to.eql(`\n${text}\n\n`);
  });

  it('supports raw spinner spacing without wrapping styles', () => {
    const text = `${c.cyan('jsr:')}${c.white('2')}${c.gray('/2')}`;

    expect(Cli.Fmt.spinnerRaw(text, false)).to.eql(text);
    expect(Cli.Fmt.spinnerRaw(text, true)).to.eql(`${text}\n`);
  });
});
