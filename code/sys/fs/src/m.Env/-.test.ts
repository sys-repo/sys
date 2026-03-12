import { describe, expect, it } from '../-test.ts';
import { Fs } from '../m.Fs/mod.ts';
import { Env } from './mod.ts';

describe('Env', () => {
  describe('.load', () => {
    const PROCESS_ENV_KEY = 'TEST_ENV_PROCESS_ONLY';
    const PROCESS_ENV_VALUE = 'process-only';

    const withProcessEnv = async (fn: () => Promise<void>) => {
      const original = Deno.env.get(PROCESS_ENV_KEY);
      Deno.env.set(PROCESS_ENV_KEY, PROCESS_ENV_VALUE);
      try {
        await fn();
      } finally {
        if (original == null) Deno.env.delete(PROCESS_ENV_KEY);
        else Deno.env.set(PROCESS_ENV_KEY, original);
      }
    };

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

    it('search:"cwd" with cwd + parent .env files → loads cwd only', async () => {
      const root = (await Fs.makeTempDir()).absolute;
      try {
        const parent = Fs.join(root, 'parent');
        const child = Fs.join(parent, 'child');
        await Fs.ensureDir(parent);
        await Fs.ensureDir(child);

        await Fs.write(Fs.join(parent, '.env'), 'SHARED="parent"\nPARENT_ONLY="parent"\n');
        await Fs.write(Fs.join(child, '.env'), 'SHARED="child"\nCHILD_ONLY="child"\n');

        const env = await Env.load({ cwd: child, search: 'cwd' });
        expect(env.get('SHARED')).to.eql('child');
        expect(env.get('CHILD_ONLY')).to.eql('child');
        expect(env.get('PARENT_ONLY')).to.eql('');
      } finally {
        await Fs.remove(root);
      }
    });

    it('search:"upward" with no .env files → falls back to process env', async () => {
      const root = (await Fs.makeTempDir()).absolute;
      try {
        const parent = Fs.join(root, 'parent');
        const child = Fs.join(parent, 'child');
        await Fs.ensureDir(parent);
        await Fs.ensureDir(child);

        await withProcessEnv(async () => {
          const env = await Env.load({ cwd: child, search: 'upward' });
          expect(env.get(PROCESS_ENV_KEY)).to.eql(PROCESS_ENV_VALUE);
        });
      } finally {
        await Fs.remove(root);
      }
    });

    it('search:"upward" resolves parent .env', async () => {
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

    it('search:"upward" merges ancestor .env files root → package', async () => {
      const root = (await Fs.makeTempDir()).absolute;
      try {
        const level1 = Fs.join(root, 'level1');
        const level2 = Fs.join(level1, 'level2');
        const level3 = Fs.join(level2, 'level3');
        await Fs.ensureDir(level1);
        await Fs.ensureDir(level2);
        await Fs.ensureDir(level3);

        await Fs.write(Fs.join(root, '.env'), 'ROOT_ONLY="root"\nSHARED="root"\n');
        await Fs.write(Fs.join(level2, '.env'), 'PACKAGE_ONLY="package"\nSHARED="package"\n');

        const env = await Env.load({ cwd: level3, search: 'upward' });
        expect(env.get('ROOT_ONLY')).to.eql('root');
        expect(env.get('PACKAGE_ONLY')).to.eql('package');
        expect(env.get('SHARED')).to.eql('package');
      } finally {
        await Fs.remove(root);
      }
    });

    it('search:"upward" keeps root-only key when package .env exists', async () => {
      const root = (await Fs.makeTempDir()).absolute;
      try {
        const pkg = Fs.join(root, 'pkg');
        await Fs.ensureDir(pkg);

        await Fs.write(Fs.join(root, '.env'), 'ROOT_ONLY="root"\n');
        await Fs.write(Fs.join(pkg, '.env'), 'PACKAGE_ONLY="package"\n');

        const env = await Env.load({ cwd: pkg, search: 'upward' });
        expect(env.get('ROOT_ONLY')).to.eql('root');
      } finally {
        await Fs.remove(root);
      }
    });

    it('search:"upward" falls back to process env when merged .env files do not provide the key', async () => {
      const root = (await Fs.makeTempDir()).absolute;
      try {
        const pkg = Fs.join(root, 'pkg');
        await Fs.ensureDir(pkg);

        await Fs.write(Fs.join(root, '.env'), 'ROOT_ONLY="root"\n');
        await Fs.write(Fs.join(pkg, '.env'), 'PACKAGE_ONLY="package"\n');

        await withProcessEnv(async () => {
          const env = await Env.load({ cwd: pkg, search: 'upward' });
          expect(env.get(PROCESS_ENV_KEY)).to.eql(PROCESS_ENV_VALUE);
        });
      } finally {
        await Fs.remove(root);
      }
    });

    it('search:"upward" with empty .env value → does not fall through to process env', async () => {
      const root = (await Fs.makeTempDir()).absolute;
      try {
        const pkg = Fs.join(root, 'pkg');
        await Fs.ensureDir(pkg);

        await Fs.write(Fs.join(root, '.env'), `${PROCESS_ENV_KEY}=""\n`);

        await withProcessEnv(async () => {
          const env = await Env.load({ cwd: pkg, search: 'upward' });
          expect(env.get(PROCESS_ENV_KEY)).to.eql('');
        });
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
