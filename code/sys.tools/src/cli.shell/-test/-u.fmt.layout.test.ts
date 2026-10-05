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

  it('aligns section content by terminal-cell width', () => {
    const text = Cli.stripAnsi(renderShellOutput('wide labels', [
      { label: '界', lines: ['one'] },
      { label: 'abc', lines: ['two'] },
    ]));
    const lines = text.split('\n');
    const first = lines.find((line) => line.includes('one')) ?? '';
    const second = lines.find((line) => line.includes('two')) ?? '';
    const firstPrefix = first.slice(0, first.indexOf('one'));
    const secondPrefix = second.slice(0, second.indexOf('two'));

    expect(Cli.Fmt.Text.Width.measure(firstPrefix)).to.eql(7);
    expect(Cli.Fmt.Text.Width.measure(secondPrefix)).to.eql(7);
  });
});
