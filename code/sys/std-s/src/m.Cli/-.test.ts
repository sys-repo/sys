import { Args, Path } from '@sys/std';
import { describe, expect, it } from '../-test.ts';
import { Cli, Format } from './mod.ts';

describe('Cli', () => {
  it('API', () => {
    expect(Cli.Path).to.equal(Path);
    expect(Cli.Format).to.equal(Format);
    expect(Cli.Args).to.equal(Args);
    expect(Cli.args).to.equal(Args.parse);
  });
});
