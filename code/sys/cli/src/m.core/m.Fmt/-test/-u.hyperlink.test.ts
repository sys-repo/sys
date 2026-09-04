import { c, describe, expect, it, Path } from '../../../-test.ts';
import { Fmt, stripAnsi } from '../../mod.ts';

const OSC_8 = '\x1b]8;;';
const STRING_TERMINATOR = '\x1b\\';

describe('Cli.Fmt.hyperlink', () => {
  it('frames a serialized file URL with the exact OSC 8 open and close sequences', () => {
    const url = Path.toFileUrl(Path.resolve('sandbox report.log.md'));
    const label = 'sandbox-report.log.md';
    const result = Fmt.hyperlink(label, url);

    expect(url.href).to.contain('sandbox%20report.log.md');
    expect(result).to.eql(
      `${OSC_8}${url.href}${STRING_TERMINATOR}${c.underline(label)}${OSC_8}${STRING_TERMINATOR}`,
    );
  });

  it('underlines styled labels while preserving ANSI stripping and cell width', () => {
    const label = c.cyan('sandbox-report.log.md');
    const result = Fmt.hyperlink(label, new URL('file:///tmp/sandbox-report.log.md'));

    expect(result).to.contain(c.underline(label));
    expect(stripAnsi(result)).to.eql('sandbox-report.log.md');
    expect(Fmt.Text.Width.measure(result)).to.eql(Fmt.Text.Width.measure(label));
  });
});
