import { describe, expect, it } from '../../-test.ts';
import { Git } from '../mod.ts';
import type { t } from '../common.ts';
import { Process } from '../common.ts';
import { Fs } from '@sys/fs';

type InvokeArgs = Parameters<typeof Process.invoke>[0] & { strict?: boolean };

describe('Git.root (integration)', () => {
  it('resolves the repository root from a nested working directory', async () => {
    const probe = await Git.probe();
    if (!probe.ok) return;

    const dir = await Fs.makeTempDir({ prefix: 'git-root-' });
    const cwd = dir.absolute;
    const expected = await Fs.realPath(cwd);
    try {
      const initArgs: InvokeArgs = {
        cmd: 'git',
        args: ['init'],
        cwd,
        silent: true,
        strict: false,
      };
      await Process.invoke(initArgs);
      const emailArgs: InvokeArgs = {
        cmd: 'git',
        args: ['config', 'user.email', 'test@example.com'],
        cwd,
        silent: true,
        strict: false,
      };
      await Process.invoke(emailArgs);
      const nameArgs: InvokeArgs = {
        cmd: 'git',
        args: ['config', 'user.name', 'Test'],
        cwd,
        silent: true,
        strict: false,
      };
      await Process.invoke(nameArgs);

      await Fs.ensureDir(`${cwd}/a/b`);
      await Fs.write(`${cwd}/a/b/tracked.txt`, 'content');

      const nested: t.StringDir = `${cwd}/a/b`;
      const res = await Git.root({ cwd: nested });
      expect(res.ok).to.eql(true);
      if (res.ok) {
        const actual = await Fs.realPath(res.root);
        expect(actual).to.eql(expected);
      }
    } finally {
      await Fs.remove(cwd);
    }
  });
});
