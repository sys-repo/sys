import { Args } from '@sys/std';
import { describe, expect, it } from '../-test.ts';
import { Cli, Format } from './mod.ts';

describe('Cli', () => {
  it('API', () => {
    expect(Cli.Args).to.equal(Args);
    expect(Cli.args).to.equal(Args.parse);
    expect(Cli.Format).to.equal(Format);
  });
});
