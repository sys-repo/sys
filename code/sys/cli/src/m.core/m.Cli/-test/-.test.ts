import { describe, expect, it } from '../../../-test.ts';
import { Args, Path } from '../../../common.ts';
import { c, Cli, Fmt, Keyboard, Prompt, Spinner, Table } from '../../mod.ts';
import { Input } from '../../m.Input/mod.ts';
import { copyToClipboard } from '../../u/mod.ts';

describe('CLI: core / m.Cli', () => {
  it('API', async () => {
    const m = await import('@sys/cli/core');
    expect(m.Cli).to.equal(Cli);

    expect(Cli.Path).to.equal(Path);
    expect(Cli.Args).to.equal(Args);

    expect(Cli.Fmt).to.equal(Fmt);
    expect(Cli.Keyboard).to.equal(Keyboard);
    expect(Cli.Spinner).to.equal(Spinner);
    expect(Cli.Table).to.equal(Table);

    expect(Cli.Prompt).to.equal(Prompt);
    expect(Cli.Input).to.equal(Input);

    expect(Cli.args).to.equal(Args.parse);
    expect(Cli.keypress).to.equal(Keyboard.keypress);
    expect(Cli.copyToClipboard).to.equal(copyToClipboard);
  });

  it('Cli.stripAnsi', () => {
    const test = (input: string, output: string) => {
      expect(Cli.stripAnsi(input)).to.eql(output);
    };
    test('foobar', 'foobar');
    test(c.cyan('foobar'), 'foobar');
    test(`foo${c.green('bar')} baz`, 'foobar baz');
  });
});
