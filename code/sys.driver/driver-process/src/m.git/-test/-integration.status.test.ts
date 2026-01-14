import { describe, expect, Fs, it } from '../../-test.ts';
import { Process } from '../common.ts';
import { Git } from '../mod.ts';

describe('Git.status (integration)', () => {
  it('reports tracked + untracked entries in a fresh repo', async () => {
    const probe = await Git.probe();
    if (!probe.ok) return;

    const dir = await Fs.makeTempDir({ prefix: 'git-status-' });
    const cwd = dir.absolute;
    try {
      await Process.invoke({
        cmd: 'git',
        args: ['init'],
        cwd,
        silent: true,
      });
      await Process.invoke({
        cmd: 'git',
        args: ['config', 'user.email', 'test@example.com'],
        cwd,
        silent: true,
      });
      await Process.invoke({
        cmd: 'git',
        args: ['config', 'user.name', 'Test'],
        cwd,
        silent: true,
      });

      await Fs.write(`${cwd}/tracked.txt`, 'v1');
      await Process.invoke({
        cmd: 'git',
        args: ['add', 'tracked.txt'],
        cwd,
        silent: true,
      });
      await Fs.write(`${cwd}/tracked.txt`, 'v2');
      await Fs.write(`${cwd}/untracked.txt`, 'x');

      const res = await Git.status({ cwd });
      expect(res.ok).to.eql(true);
      if (res.ok) {
        expect(res.entries.some((entry) => entry.path === 'tracked.txt')).to.eql(true);
        expect(res.entries.some((entry) => entry.path === 'untracked.txt')).to.eql(true);
      }

      const res2 = await Git.status({ cwd, untracked: false });
      expect(res2.ok).to.eql(true);
      if (res2.ok) {
        expect(res2.entries.some((entry) => entry.path === 'tracked.txt')).to.eql(true);
        expect(res2.entries.some((entry) => entry.path === 'untracked.txt')).to.eql(false);
      }
    } finally {
      await Fs.remove(cwd);
    }
  });
});
