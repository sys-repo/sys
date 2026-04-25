import { describe, expect, it } from '../../../-test.ts';
import { Fs, Str, type t } from '../common.ts';
import { bootstrapGitattributes, ensureGitattributes } from '../u.ensure.gitattributes.ts';

const CANONICAL = `${
  Str.dedent(`
  # Enforce consistent line endings
  * text=auto

  # Track common large binary assets with Git LFS:
  *.mp4 filter=lfs diff=lfs merge=lfs -text
  *.webm filter=lfs diff=lfs merge=lfs -text
  *.mov filter=lfs diff=lfs merge=lfs -text
`).trim()
}
`;

describe('@sys/driver-agent/pi/cli/u.ensure.gitattributes', () => {
  it('ensureGitattributes → no-op when .gitattributes is missing', async () => {
    const cwd = await tempDir();
    try {
      await ensureGitattributes(cwd);
      expect(await Fs.exists(Fs.join(cwd, '.gitattributes'))).to.eql(false);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('bootstrapGitattributes → creates the canonical file when missing', async () => {
    const cwd = await tempDir();
    const path = Fs.join(cwd, '.gitattributes') as t.StringPath;
    try {
      await bootstrapGitattributes(cwd);
      await bootstrapGitattributes(cwd);

      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql(CANONICAL);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('ensureGitattributes → appends missing media LFS lines once', async () => {
    const cwd = await tempDir();
    const path = Fs.join(cwd, '.gitattributes') as t.StringPath;
    try {
      await Fs.write(path, '*.mp4 filter=lfs diff=lfs merge=lfs -text\ncustom=value\n');

      await ensureGitattributes(cwd);
      await ensureGitattributes(cwd);

      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql(
        '*.mp4 filter=lfs diff=lfs merge=lfs -text\ncustom=value\n*.webm filter=lfs diff=lfs merge=lfs -text\n*.mov filter=lfs diff=lfs merge=lfs -text\n',
      );
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('bootstrapGitattributes → preserves existing ordering-sensitive content', async () => {
    const cwd = await tempDir();
    const path = Fs.join(cwd, '.gitattributes') as t.StringPath;
    try {
      await Fs.write(path, '# repo policy\n* text eol=lf\n');

      await bootstrapGitattributes(cwd);

      const read = await Fs.readText(path);
      if (!read.ok) throw read.error;
      expect(read.data).to.eql(
        '# repo policy\n* text eol=lf\n*.mp4 filter=lfs diff=lfs merge=lfs -text\n*.webm filter=lfs diff=lfs merge=lfs -text\n*.mov filter=lfs diff=lfs merge=lfs -text\n',
      );
    } finally {
      await Fs.remove(cwd);
    }
  });
});

async function tempDir() {
  return (await Fs.makeTempDir()).absolute as t.StringDir;
}
