import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { bootstrapGitignore, ensureGitignore } from '../u.ensure.gitignore.ts';

describe('@sys/driver-pi/cli/u.ensure.gitignore', () => {
  it('ensureGitignore → no-op when .gitignore is missing', async () => {
    const cwd = await tempDir();
    try {
      await ensureGitignore(cwd);
      expect(await Fs.exists(Fs.join(cwd, '.gitignore'))).to.eql(false);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('bootstrapGitignore → creates a fresh .gitignore when missing', async () => {
    const cwd = await tempDir();
    const path = Fs.join(cwd, '.gitignore') as t.StringPath;
    try {
      await bootstrapGitignore(cwd);
      await bootstrapGitignore(cwd);

      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql('.pi/\n.log/\n.tmp/\n');
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('ensureGitignore → appends required pi runtime entries once', async () => {
    const cwd = await tempDir();
    const path = Fs.join(cwd, '.gitignore') as t.StringPath;
    try {
      await Fs.write(path, 'node_modules/\n');

      await ensureGitignore(cwd);
      await ensureGitignore(cwd);

      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql('node_modules/\n.pi/\n.log/\n.tmp/\n');
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('ensureGitignore → treats slashless forms as already present', async () => {
    const cwd = await tempDir();
    const path = Fs.join(cwd, '.gitignore') as t.StringPath;
    try {
      await Fs.write(path, '.pi\n.log\n.tmp\n');

      await ensureGitignore(cwd);

      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql('.pi\n.log\n.tmp\n');
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('ensureGitignore → ignores comments when checking for required entries', async () => {
    const cwd = await tempDir();
    const path = Fs.join(cwd, '.gitignore') as t.StringPath;
    try {
      await Fs.write(path, '# .pi/\n');

      await ensureGitignore(cwd);

      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql('# .pi/\n.pi/\n.log/\n.tmp/\n');
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('bootstrapGitignore → preserves an existing .gitignore and fills missing entries', async () => {
    const cwd = await tempDir();
    const path = Fs.join(cwd, '.gitignore') as t.StringPath;
    try {
      await Fs.write(path, 'node_modules/\n');

      await bootstrapGitignore(cwd);

      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql('node_modules/\n.pi/\n.log/\n.tmp/\n');
    } finally {
      await Fs.remove(cwd);
    }
  });
});

async function tempDir() {
  return (await Fs.makeTempDir()).absolute as t.StringDir;
}
