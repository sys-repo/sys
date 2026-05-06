import { c, Cli, describe, expect, it } from '../../-test.ts';
import { field, renderShellOutput } from '../u.fmt.layout.ts';

describe('cli.shell output layout', () => {
  it('renders ANSI-safe section columns with a trailing newline', () => {
    const output = renderShellOutput('demo', [
      { label: 'short', lines: ['one', 'two'] },
      { label: 'longer', lines: [field('key', c.green('value'), 5)] },
    ]);

    const text = Cli.stripAnsi(output).replaceAll('\u200B', '');

    expect(output.endsWith('\n')).to.eql(true);
    expect(text).to.eql(
      `  system:shell demo

  short   one
          two

  longer  key:  value
`,
    );
  });
});
