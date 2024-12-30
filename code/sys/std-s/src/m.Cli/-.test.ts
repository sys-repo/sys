import { Args, Path } from '@sys/std';
import { describe, expect, it } from '../-test.ts';
import { c, Cli, Format, Keyboard, Prompts, Spinner, Table } from './mod.ts';

describe('Cli', () => {
  it('API', () => {
    expect(Cli.Path).to.equal(Path);
    expect(Cli.Args).to.equal(Args);

    expect(Cli.Format).to.equal(Format);
    expect(Cli.Keyboard).to.equal(Keyboard);
    expect(Cli.Prompts).to.equal(Prompts);
    expect(Cli.Spinner).to.equal(Spinner);
    expect(Cli.Table).to.equal(Table);

    expect(Cli.args).to.equal(Args.parse);
    expect(Cli.keypress).to.equal(Keyboard.keypress);
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
