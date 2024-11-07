import { Args, Path } from '@sys/std';
import { describe, expect, it } from '../-test.ts';
import { Cli, Format, Keyboard, Prompts, Spinner, Table } from './mod.ts';

describe('Cli', () => {
  it('API', () => {
    expect(Cli.Path).to.equal(Path);
    expect(Cli.Args).to.equal(Args);
    expect(Cli.args).to.equal(Args.parse);

    expect(Cli.Format).to.equal(Format);
    expect(Cli.Keyboard).to.equal(Keyboard);
    expect(Cli.Prompts).to.equal(Prompts);
    expect(Cli.Spinner).to.equal(Spinner);
    expect(Cli.Table).to.equal(Table);
  });
});
