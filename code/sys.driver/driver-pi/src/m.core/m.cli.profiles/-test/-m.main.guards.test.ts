import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { Process } from '../../m.cli/common.ts';
import { Profiles } from '../mod.ts';
import { GitInitMenu } from '../../m.cli/u.menu.git.init.ts';

describe(`@sys/driver-pi/cli/Profiles/m.main/guards`, () => {
  it('supports cwd-only git root resolution for smoke testing', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const nested = Fs.join(cwd, 'a', 'b') as t.StringDir;
    const prevPrompt = GitInitMenu.prompt;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(nested);
      Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'exit' });
      const res = await Profiles.main({
        cwd: nested,
        argv: ['--git-root', 'cwd'],
        tty: { stdin: true, stdout: true },
      });
      expect(res.kind).to.eql('exit');
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });

  it('exits cleanly when git init recovery is declined', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const prevPrompt = GitInitMenu.prompt;
    try {
      Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'exit' });
      const res = await Profiles.main({
        cwd,
        argv: ['--profile', 'canon'],
        tty: { stdin: true, stdout: true },
      });
      expect(res.kind).to.eql('exit');
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });

  it('requires direct inputs in non-interactive mode', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const prevPrompt = GitInitMenu.prompt;
    try {
      Object.defineProperty(GitInitMenu, 'prompt', {
        value: async () => {
          throw new Error('Git init prompt should not run in non-interactive mode.');
        },
      });

      let error = '';
      try {
        await Profiles.main({ cwd, argv: ['--non-interactive'] });
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }

      expect(error).to.eql(
        'Missing required flag: --profile <name|path> (required with --non-interactive).',
      );
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });

  it('fails clearly instead of opening the profile menu when no TTY is available', async () => {
    const prev = Process.inherit;
    try {
      Process.inherit = async () => {
        throw new Error('Pi should not launch without a selected profile.');
      };

      let error = '';
      try {
        await Profiles.main({ argv: [], tty: { stdin: false, stdout: false } });
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }

      expect(error).to.contain(
        'Cannot open the interactive profile menu because stdin/stdout is not a TTY.',
      );
      expect(error).to.contain('Pass --profile <name|path>');
      expect(error).to.contain('Use --help for wrapper help');
      expect(error).to.contain('args after -- are passed to Pi after a profile is selected');
    } finally {
      Process.inherit = prev;
    }
  });

  it('refuses to implicitly create missing named profile configs', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi/canon.yaml` as t.StringPath;
    const prev = Process.inherit;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      Process.inherit = async () => {
        throw new Error('Pi should not launch when the named profile is missing.');
      };

      let error = '';
      try {
        await Profiles.main({ cwd, argv: ['--profile', 'canon'] });
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }

      expect(error).to.contain('Profile config not found:');
      expect(error).to.contain('-config/@sys.driver-pi/canon.yaml');
      expect(error).to.contain('Named profiles are not created implicitly');
      expect(await Fs.exists(config)).to.eql(false);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('rejects the removed --config selector', async () => {
    let error = '';
    try {
      await Profiles.main({ argv: ['--config', './a.yaml'] });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
    expect(error).to.eql('--config has been replaced by --profile <name|path>.');
  });
});
