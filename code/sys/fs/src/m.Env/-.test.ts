import { describe, expect, it } from '../-test.ts';
import { Fs } from '../m.Fs/mod.ts';
import { Env } from './mod.ts';

describe('Env', () => {
  describe('.load', () => {
    it('search:"cwd" loads only cwd .env', async () => {
      const root = (await Fs.makeTempDir()).absolute;
      try {
        const parent = Fs.join(root, 'parent');
        const child = Fs.join(parent, 'child');
        await Fs.ensureDir(parent);
        await Fs.ensureDir(child);

        await Fs.write(Fs.join(parent, '.env'), 'TEST_ENV_SCOPE="parent"\n');
        const env = await Env.load({ cwd: child, search: 'cwd' });

        expect(env.get('TEST_ENV_SCOPE')).to.eql('');
      } finally {
        await Fs.remove(root);
      }
    });

    it('search:"upward" resolves nearest parent .env', async () => {
      const root = (await Fs.makeTempDir()).absolute;
      try {
        const parent = Fs.join(root, 'parent');
        const child = Fs.join(parent, 'child');
        await Fs.ensureDir(parent);
        await Fs.ensureDir(child);

        await Fs.write(Fs.join(parent, '.env'), 'TEST_ENV_SCOPE="parent"\n');
        const env = await Env.load({ cwd: child, search: 'upward' });

        expect(env.get('TEST_ENV_SCOPE')).to.eql('parent');
      } finally {
        await Fs.remove(root);
      }
    });

    it('search:"upward" prefers nearest .env when multiple ancestors exist', async () => {
      const root = (await Fs.makeTempDir()).absolute;
      try {
        const level1 = Fs.join(root, 'level1');
        const level2 = Fs.join(level1, 'level2');
        const level3 = Fs.join(level2, 'level3');
        await Fs.ensureDir(level1);
        await Fs.ensureDir(level2);
        await Fs.ensureDir(level3);

        await Fs.write(Fs.join(root, '.env'), 'TEST_ENV_SCOPE="root"\n');
        await Fs.write(Fs.join(level2, '.env'), 'TEST_ENV_SCOPE="level2"\n');

        const env = await Env.load({ cwd: level3, search: 'upward' });
        expect(env.get('TEST_ENV_SCOPE')).to.eql('level2');
      } finally {
        await Fs.remove(root);
      }
    });

    it('env.get ← key does not exist (empty string)', async () => {
      const root = (await Fs.makeTempDir()).absolute;
      try {
        const env = await Env.load({ cwd: root, search: 'cwd' });
        expect(env.get('404')).to.eql('');
      } finally {
        await Fs.remove(root);
      }
    });
  });

  describe('Env.Is', () => {
    it('Is.vscode', () => {
      const flag = Env.Is.vscode;
      expect(typeof flag === 'boolean').to.be.true;
    });
  });
});
