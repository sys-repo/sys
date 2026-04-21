import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { ensureGitignore } from '../u.ensure.gitignore.ts';

describe('@sys/driver-agent/pi/cli/u.ensure.gitignore', () => {
  it('no-op when .gitignore is missing', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    try {
      await ensureGitignore(cwd);
      expect(await Fs.exists(Fs.join(cwd, '.gitignore'))).to.eql(false);
    } finally {
      await Deno.remove(cwd, { recursive: true });
    }
  });

  it('appends required pi runtime entries once', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const path = Fs.join(cwd, '.gitignore') as t.StringPath;
    try {
      await Fs.write(path, 'node_modules/\n');

      await ensureGitignore(cwd);
      await ensureGitignore(cwd);

      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql('node_modules/\n.pi/\n.log/\n.tmp/\n');
    } finally {
      await Deno.remove(cwd, { recursive: true });
    }
  });

  it('treats slashless forms as already present', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const path = Fs.join(cwd, '.gitignore') as t.StringPath;
    try {
      await Fs.write(path, '.pi\n.log\n.tmp\n');

      await ensureGitignore(cwd);

      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql('.pi\n.log\n.tmp\n');
    } finally {
      await Deno.remove(cwd, { recursive: true });
    }
  });

  it('ignores comments when checking for required entries', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const path = Fs.join(cwd, '.gitignore') as t.StringPath;
    try {
      await Fs.write(path, '# .pi/\n');

      await ensureGitignore(cwd);

      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql('# .pi/\n.pi/\n.log/\n.tmp/\n');
    } finally {
      await Deno.remove(cwd, { recursive: true });
    }
  });
});
