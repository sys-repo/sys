import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { resolveRead } from '../u.resolve.read.ts';

describe(`@sys/driver-agent/pi/cli/u.resolve.read`, () => {
  it('includes HOME so Pi can probe context files from any home subdirectory', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.resolve.read.test.' }))
      .absolute as t.StringDir;
    const cwd = Fs.join(root, 'temp', 'foo') as t.StringDir;
    const denoDir = Fs.join(cwd, '.tmp', 'pi.cli', 'deno') as t.StringDir;
    const prevHome = Deno.env.get('HOME');

    try {
      Deno.env.set('HOME', root);
      await Fs.ensureDir(denoDir);

      const paths = await resolveRead(cwd, denoDir);
      expect(paths).to.include(root);
    } finally {
      restoreEnv('HOME', prevHome);
      await Fs.remove(root);
    }
  });

  it('includes sibling sys.canon authority files when present above the repo root', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.resolve.read.test.' }))
      .absolute as t.StringDir;
    const org = Fs.join(root, 'org.sys') as t.StringDir;
    const repo = Fs.join(org, 'sys') as t.StringDir;
    const canon = Fs.join(org, 'sys.canon') as t.StringDir;
    const cwd = Fs.join(repo, 'code', 'pkg') as t.StringDir;
    const denoDir = Fs.join(cwd, '.tmp', 'pi.cli', 'deno') as t.StringDir;

    try {
      await Fs.ensureDir(cwd);
      await Fs.ensureDir(denoDir);
      await Fs.ensureDir(canon);
      await Fs.write(Fs.join(org, 'AGENTS.md'), '# root');
      await Fs.write(Fs.join(repo, 'AGENTS.md'), '# repo');
      await Fs.write(Fs.join(repo, '.git'), 'gitdir: ./.git/worktrees/test');
      await Fs.write(Fs.join(canon, 'AGENTS.md'), '# canon');
      await Fs.ensureDir(Fs.join(canon, '-canon'));
      await Fs.write(Fs.join(canon, '-canon', 'README.md'), '# readme');
      await Fs.write(Fs.join(canon, '-canon', 'protocol.cli.md'), '# cli');

      const paths = await resolveRead(cwd, denoDir);
      expect(paths).to.include(Fs.join(org, 'AGENTS.md'));
      expect(paths).to.include(Fs.join(canon, 'AGENTS.md'));
      expect(paths).to.include(Fs.join(canon, '-canon', 'README.md'));
      expect(paths).to.include(Fs.join(canon, '-canon', 'protocol.cli.md'));
    } finally {
      await Fs.remove(root);
    }
  });
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    Deno.env.delete(name);
    return;
  }
  Deno.env.set(name, value);
}
