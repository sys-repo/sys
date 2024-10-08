import { describe, it, expect, type t } from '../-test.ts';
import { Args } from '@sys/std';
import { Cli } from './mod.ts';

describe('Cli', () => {
  it('Cli.Args', () => {
    expect(Cli.Args).to.equal(Args);
    expect(Cli.args).to.equal(Args.parse);
  });
});
