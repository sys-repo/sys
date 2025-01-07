import { describe, expect, it, pkg } from '../-test.ts';
import { Cmd, Main } from './mod.ts';

describe('Cmd', () => {
  it('API', () => {
    expect(Main.Cmd).to.equal(Cmd);
    expect(Main.entry).to.equal(Cmd.main);
    expect(Main.pkg).to.equal(pkg);
  });

  describe('Cmd.main', () => {
    it('sample', () => {
      Cmd.main([]);
    });
  });
});
