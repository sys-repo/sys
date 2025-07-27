import { Path, describe, expect, it } from '../-test.ts';
import { Vault } from './mod.ts';

describe('Obsidian.Vault', () => {
  describe('Vault.dir', () => {
    it('create', async () => {
      const path = Path.resolve('./src/-test/sample-vault');
      const dir = await Vault.dir(path);
      expect(dir.path).to.eql(path);
    });
  });
});
