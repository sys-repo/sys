import { describe, expect, Fs, it, Json, Path, type t } from '../../-test.ts';
import { resolvePassThroughContext } from '../u.context.ts';
import type { PassThroughTarget } from '../t.ts';

const TARGET = {
  localSpecifier: '@sys/foo',
  publishedSpecifier: 'jsr:@sys/foo@0.0.123',
  repo: {
    rootDirname: 'sys',
    configFilenames: ['deno.json', 'deno.jsonc'],
    requiredPackages: ['@sys/tools', '@sys/foo'],
    requiredDirs: ['code/sys.tools', 'code/sys.foo'],
  },
} satisfies PassThroughTarget;

describe('u.passThrough/u.context', () => {
  it('resolves local context for a matching system workspace', async () => {
    const fs = await fixture.workspace('u.passThrough.context.local.', { rootDirname: 'sys' });
    try {
      const res = await resolvePassThroughContext({ cwd: fs.cwd, target: TARGET });

      expect(res.mode).to.eql('local');
      expect(res.reason).to.eql('system-workspace');
      expect(res.specifier).to.eql('@sys/foo');
      expect(res.workspace).to.eql({
        dir: fs.root,
        file: Path.join(fs.root, 'deno.json'),
      });
    } finally {
      await Fs.remove(fs.base);
    }
  });

  it('resolves published context when no workspace exists', async () => {
    const fs = await Fs.makeTempDir({ prefix: 'u.passThrough.context.none.' });
    try {
      const cwd = fs.absolute as t.StringDir;
      const res = await resolvePassThroughContext({ cwd, target: TARGET });

      expect(res.mode).to.eql('published');
      expect(res.reason).to.eql('no-workspace');
      expect(res.specifier).to.eql('jsr:@sys/foo@0.0.123');
      expect(res.workspace).to.eql(undefined);
    } finally {
      await Fs.remove(fs.absolute);
    }
  });

  it('resolves published context when a workspace exists but does not match the required repo shape', async () => {
    const fs = await fixture.workspace('u.passThrough.context.mismatch.', { rootDirname: 'repo' });
    try {
      const res = await resolvePassThroughContext({ cwd: fs.cwd, target: TARGET });

      expect(res.mode).to.eql('published');
      expect(res.reason).to.eql('workspace-mismatch');
      expect(res.specifier).to.eql('jsr:@sys/foo@0.0.123');
      expect(res.workspace).to.eql({
        dir: fs.root,
        file: Path.join(fs.root, 'deno.json'),
      });
    } finally {
      await Fs.remove(fs.base);
    }
  });
});

const fixture = {
  async workspace(prefix: string, options: { rootDirname: string }) {
    const base = await Fs.makeTempDir({ prefix });
    const root = Path.join(base.absolute, options.rootDirname) as t.StringDir;
    const cwd = Path.join(root, 'code', 'sys.tools') as t.StringDir;

    await Fs.ensureDir(cwd);
    await Fs.write(Path.join(root, 'package.json'), Json.stringify({ private: true }, 2));
    await Fs.write(
      Path.join(root, 'deno.json'),
      Json.stringify({
        workspace: ['./code/sys.tools', './code/sys.foo'],
      }, 2),
    );
    await fixture.child(Path.join(root, 'code', 'sys.tools'), '@sys/tools');
    await fixture.child(Path.join(root, 'code', 'sys.foo'), '@sys/foo');

    return { base: base.absolute as t.StringDir, root, cwd } as const;
  },

  async child(dir: string, name: string) {
    await Fs.ensureDir(dir);
    await Fs.write(
      Path.join(dir, 'deno.json'),
      Json.stringify({
        name,
        version: '0.0.0',
      }, 2),
    );
  },
} as const;
