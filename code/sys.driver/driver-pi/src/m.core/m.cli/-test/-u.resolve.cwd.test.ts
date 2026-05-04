import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { GitInitMenu } from '../u.menu.git.init.ts';
import { resolveCwd } from '../u.resolve.cwd.ts';

describe(`@sys/driver-pi/cli/u.resolve.cwd`, () => {
  it('resolves an existing git ancestor without prompting', async () => {
    const cwd = await tempDir();
    const nested = Fs.join(cwd, 'a', 'b') as t.StringDir;
    const prevPrompt = GitInitMenu.prompt;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(nested);
      Object.defineProperty(GitInitMenu, 'prompt', {
        async value() {
          throw new Error('Git init prompt should not run when a git root already exists.');
        },
      });

      const res = await resolveCwd(nested);
      expect(res).to.eql({ kind: 'resolved', cwd: { invoked: nested, git: cwd } });
      expect(await Fs.exists(Fs.join(cwd, '.gitattributes'))).to.eql(false);
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });

  describe('git bootstrap', () => {
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

    it('updates an existing .gitignore and creates .gitattributes after git init recovery', async () => {
      const cwd = await tempDir();
      const gitignore = Fs.join(cwd, '.gitignore') as t.StringPath;
      const gitattributes = Fs.join(cwd, '.gitattributes') as t.StringPath;
      const prevPrompt = GitInitMenu.prompt;
      const prevInit = GitInitMenu.init;
      try {
        await Fs.write(gitignore, 'node_modules/\n');
        Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'create' });
        Object.defineProperty(GitInitMenu, 'init', {
          value: async () => {
            await Fs.ensureDir(Fs.join(cwd, '.git'));
            return { ok: true, bin: { git: 'git' }, cwd };
          },
        });

        const res = await resolveCwd(cwd);
        expect(res).to.eql({ kind: 'resolved', cwd: { invoked: cwd, git: cwd } });

        const readGitignore = await Fs.readText(gitignore);
        if (!readGitignore.ok) throw readGitignore.error;
        expect(readGitignore.data).to.eql('node_modules/\n.pi/\n.log/\n.tmp/\n');

        const readGitattributes = await Fs.readText(gitattributes);
        if (!readGitattributes.ok) throw readGitattributes.error;
        expect(readGitattributes.data).to.contain('* text=auto');
        expect(readGitattributes.data).to.contain('*.png filter=lfs diff=lfs merge=lfs -text');
        expect(readGitattributes.data).to.contain('*.webp filter=lfs diff=lfs merge=lfs -text');
        expect(readGitattributes.data).to.contain('*.mp4 filter=lfs diff=lfs merge=lfs -text');
      } finally {
        Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
        Object.defineProperty(GitInitMenu, 'init', { value: prevInit });
        await Fs.remove(cwd);
      }
    });

    it('creates fresh .gitignore and .gitattributes files after git init recovery when missing', async () => {
      const cwd = await tempDir();
      const gitignore = Fs.join(cwd, '.gitignore') as t.StringPath;
      const gitattributes = Fs.join(cwd, '.gitattributes') as t.StringPath;
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

        const readGitignore = await Fs.readText(gitignore);
        if (!readGitignore.ok) throw readGitignore.error;
        expect(readGitignore.data).to.eql('.pi/\n.log/\n.tmp/\n');

        const readGitattributes = await Fs.readText(gitattributes);
        if (!readGitattributes.ok) throw readGitattributes.error;
        expect(readGitattributes.data).to.contain('# Enforce consistent line endings');
        expect(readGitattributes.data).to.contain('*.png filter=lfs diff=lfs merge=lfs -text');
        expect(readGitattributes.data).to.contain('*.webp filter=lfs diff=lfs merge=lfs -text');
        expect(readGitattributes.data).to.contain('*.mov filter=lfs diff=lfs merge=lfs -text');
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

  it('uses cwd-only git resolution when requested', async () => {
    const cwd = await tempDir();
    const nested = Fs.join(cwd, 'a', 'b') as t.StringDir;
    const prevPrompt = GitInitMenu.prompt;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(nested);
      Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'exit' });

      const res = await resolveCwd(nested, { gitRoot: 'cwd' });
      expect(res).to.eql({ kind: 'exit' });
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });

  it('uses cwd as the runtime root without requiring git when requested', async () => {
    const cwd = await tempDir();
    const prevPrompt = GitInitMenu.prompt;
    try {
      Object.defineProperty(GitInitMenu, 'prompt', {
        value: async () => {
          throw new Error('Git init prompt should not run for --git-root none.');
        },
      });

      const res = await resolveCwd(cwd, { gitRoot: 'none' });
      expect(res).to.eql({ kind: 'resolved', cwd: { invoked: cwd, root: cwd } });
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });

  it('ignores stale INIT_CWD when no cwd input is provided', async () => {
    const cwd = await tempDir();
    const prevCwd = Deno.cwd();
    const prevPrompt = GitInitMenu.prompt;
    const key = 'INIT_CWD';
    const before = Deno.env.get(key);
    try {
      Deno.chdir(cwd);
      const invoked = Deno.cwd() as t.StringDir;
      Deno.env.set(key, '/tmp/stale-init-cwd');
      Object.defineProperty(GitInitMenu, 'prompt', {
        value: async (path: t.StringDir) => {
          expect(path).to.eql(invoked);
          return 'exit';
        },
      });

      const res = await resolveCwd(undefined, { gitRoot: 'cwd' });
      expect(res).to.eql({ kind: 'exit' });
    } finally {
      Deno.chdir(prevCwd);
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      before === undefined ? Deno.env.delete(key) : Deno.env.set(key, before);
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

  it('fails without prompting when interactive recovery is disabled', async () => {
    const cwd = await tempDir();
    const prevPrompt = GitInitMenu.prompt;
    try {
      Object.defineProperty(GitInitMenu, 'prompt', {
        value: async () => {
          throw new Error('Git init prompt should not run when interactive recovery is disabled.');
        },
      });

      let error = '';
      try {
        await resolveCwd(cwd, { interactive: false });
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }

      expect(error).to.eql(
        `Pi startup requires a git repository root. No .git ancestor found from ${cwd}`,
      );
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });
});

async function tempDir() {
  return (await Fs.makeTempDir()).absolute as t.StringDir;
}
