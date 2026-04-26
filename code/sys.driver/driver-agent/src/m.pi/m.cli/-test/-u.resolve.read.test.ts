import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { resolveRead } from '../u.resolve.read.ts';

describe(`@sys/driver-agent/pi/cli/u.resolve.read`, () => {
  it('includes sibling sys.canon authority files when present above the repo root', async () => {
    const root = await Deno.makeTempDir();
    const org = Fs.join(root, 'org.sys') as t.StringDir;
    const repo = Fs.join(org, 'sys') as t.StringDir;
    const canon = Fs.join(org, 'sys.canon') as t.StringDir;
    const cwd = Fs.join(repo, 'code', 'pkg') as t.StringDir;
    const denoDir = Fs.join(cwd, '.tmp', 'pi.cli', 'deno') as t.StringDir;

    try {
      await Deno.mkdir(Fs.join(cwd), { recursive: true });
      await Deno.mkdir(denoDir, { recursive: true });
      await Deno.mkdir(canon, { recursive: true });
      await Deno.writeTextFile(Fs.join(org, 'AGENTS.md'), '# root');
      await Deno.writeTextFile(Fs.join(repo, 'AGENTS.md'), '# repo');
      await Deno.writeTextFile(Fs.join(repo, '.git'), 'gitdir: ./.git/worktrees/test');
      await Deno.writeTextFile(Fs.join(canon, 'AGENTS.md'), '# canon');
      await Deno.mkdir(Fs.join(canon, '-canon'), { recursive: true });
      await Deno.writeTextFile(Fs.join(canon, '-canon', 'README.md'), '# readme');
      await Deno.writeTextFile(Fs.join(canon, '-canon', 'protocol.cli.md'), '# cli');

      const paths = await resolveRead(cwd, denoDir);
      expect(paths).to.include(Fs.join(org, 'AGENTS.md'));
      expect(paths).to.include(Fs.join(canon, 'AGENTS.md'));
      expect(paths).to.include(Fs.join(canon, '-canon', 'README.md'));
      expect(paths).to.include(Fs.join(canon, '-canon', 'protocol.cli.md'));
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
});
