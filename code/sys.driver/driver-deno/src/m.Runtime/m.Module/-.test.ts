import { type t, describe, it, expect, Testing } from '../../-test.ts';
import { Module } from './mod.ts';
import { upgrade } from './u.upgrade.ts';

describe('DenoModule', () => {
  it('API', async () => {
    expect(Module.upgrade).to.equal(upgrade);
  });
});
