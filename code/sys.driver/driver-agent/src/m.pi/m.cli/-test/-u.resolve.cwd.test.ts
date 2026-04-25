import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { GitInitMenu } from '../u.menu.git.init.ts';
import { resolveCwd } from '../u.resolve.cwd.ts';

describe(`@sys/driver-agent/pi/cli/u.resolve.cwd`, () => {
  it('resolves an existing git ancestor without prompting', async () => {
    const cwd = await tempDir();
    const nested = Fs.join(cwd, 'a', 'b') as t.StringDir;
    const prevPrompt = GitInitMenu.prompt;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(nested);
      Object.defineProperty(GitInitMenu, 'prompt', {
        value: async () => {
          throw new Error('Git init prompt should not run when a git root already exists.');
        },
      });

      const res = await resolveCwd(nested);
      expect(res).to.eql({ kind: 'resolved', cwd: { invoked: nested, git: cwd } });
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });

  describe('gitignore bootstrap', () => {
    it('updates an existing .gitignore when a git ancestor is found', async () => {
      const cwd = await tempDir();
      const nested = Fs.join(cwd, 'a') as t.StringDir;
      const path = Fs.join(cwd, '.gitignore') as t.StringPath;
      try {
        await Fs.ensureDir(Fs.join(cwd, '.git'));
        await Fs.ensureDir(nested);
        await Fs.write(path, 'node_modules/\n');

        const res = await resolveCwd(nested);
        expect(res).to.eql({ kind: 'resolved', cwd: { invoked: nested, git: cwd } });

        const read = await Fs.readText(path);
        if (!read.ok) throw read.error;
        expect(read.data).to.eql('node_modules/\n.pi/\n.log/\n.tmp/\n');
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('updates an existing .gitignore after git init recovery', async () => {
      const cwd = await tempDir();
      const path = Fs.join(cwd, '.gitignore') as t.StringPath;
      const prevPrompt = GitInitMenu.prompt;
      const prevInit = GitInitMenu.init;
      try {
        await Fs.write(path, 'node_modules/\n');
        Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'create' });
        Object.defineProperty(GitInitMenu, 'init', {
          value: async () => {
            await Fs.ensureDir(Fs.join(cwd, '.git'));
            return { ok: true, bin: { git: 'git' }, cwd };
          },
        });

        const res = await resolveCwd(cwd);
        expect(res).to.eql({ kind: 'resolved', cwd: { invoked: cwd, git: cwd } });

        const read = await Fs.readText(path);
        if (!read.ok) throw read.error;
        expect(read.data).to.eql('node_modules/\n.pi/\n.log/\n.tmp/\n');
      } finally {
        Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
        Object.defineProperty(GitInitMenu, 'init', { value: prevInit });
        await Fs.remove(cwd);
      }
    });

    it('creates a fresh .gitignore after git init recovery when missing', async () => {
      const cwd = await tempDir();
      const path = Fs.join(cwd, '.gitignore') as t.StringPath;
      const prevPrompt = GitInitMenu.prompt;
      const prevInit = GitInitMenu.init;
      try {
        Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'create' });
        Object.defineProperty(GitInitMenu, 'init', {
          value: async () => {
            await Fs.ensureDir(Fs.join(cwd, '.git'));
            return { ok: true, bin: { git: 'git' }, cwd };
          },
        });

        const res = await resolveCwd(cwd);
        expect(res).to.eql({ kind: 'resolved', cwd: { invoked: cwd, git: cwd } });

        const read = await Fs.readText(path);
        if (!read.ok) throw read.error;
        expect(read.data).to.eql('.pi/\n.log/\n.tmp/\n');
      } finally {
        Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
        Object.defineProperty(GitInitMenu, 'init', { value: prevInit });
        await Fs.remove(cwd);
      }
    });
  });

  it('offers git init and continues startup when chosen', async () => {
    const cwd = await tempDir();
    const prevPrompt = GitInitMenu.prompt;
    const prevInit = GitInitMenu.init;
    try {
      Object.defineProperty(GitInitMenu, 'prompt', {
        value: async (path: t.StringDir) => {
          expect(path).to.eql(cwd);
          return 'create';
        },
      });
      Object.defineProperty(GitInitMenu, 'init', {
        value: async (path: t.StringDir) => {
          expect(path).to.eql(cwd);
          await Fs.ensureDir(Fs.join(cwd, '.git'));
          return { ok: true, bin: { git: 'git' }, cwd };
        },
      });

      const res = await resolveCwd(cwd);
      expect(res).to.eql({ kind: 'resolved', cwd: { invoked: cwd, git: cwd } });
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      Object.defineProperty(GitInitMenu, 'init', { value: prevInit });
      await Fs.remove(cwd);
    }
  });

  it('exits clearly when git init recovery is declined', async () => {
    const cwd = await tempDir();
    const prevPrompt = GitInitMenu.prompt;
    try {
      Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'exit' });

      const res = await resolveCwd(cwd);
      expect(res).to.eql({ kind: 'exit' });
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });
});

async function tempDir() {
  return (await Fs.makeTempDir()).absolute as t.StringDir;
}
