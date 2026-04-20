import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { GitInitMenu } from '../u.menu.git.init.ts';
import { resolveCwd } from '../u.resolve.cwd.ts';

describe(`@sys/driver-agent/pi/cli/u.resolve.cwd`, () => {
  it('resolves an existing git ancestor without prompting', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const nested = Fs.join(cwd, 'a', 'b') as t.StringDir;
    const prevPrompt = GitInitMenu.prompt;
    try {
      await Deno.mkdir(Fs.join(cwd, '.git'));
      await Deno.mkdir(nested, { recursive: true });
      Object.defineProperty(GitInitMenu, 'prompt', {
        value: async () => {
          throw new Error('Git init prompt should not run when a git root already exists.');
        },
      });

      const res = await resolveCwd(nested);
      expect(res).to.eql({ kind: 'resolved', cwd: { invoked: nested, git: cwd } });
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Deno.remove(cwd, { recursive: true });
    }
  });

  it('offers git init and continues startup when chosen', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
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
          await Deno.mkdir(Fs.join(cwd, '.git'));
          return { ok: true, bin: { git: 'git' }, cwd };
        },
      });

      const res = await resolveCwd(cwd);
      expect(res).to.eql({ kind: 'resolved', cwd: { invoked: cwd, git: cwd } });
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      Object.defineProperty(GitInitMenu, 'init', { value: prevInit });
      await Deno.remove(cwd, { recursive: true });
    }
  });

  it('exits clearly when git init recovery is declined', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const prevPrompt = GitInitMenu.prompt;
    try {
      Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'exit' });

      const res = await resolveCwd(cwd);
      expect(res).to.eql({ kind: 'exit' });
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Deno.remove(cwd, { recursive: true });
    }
  });
});
