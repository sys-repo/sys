import { describe, expect, it } from '../../../../-test.ts';
import { Fs, Path, type t } from '../common.ts';
import { SandboxFs } from '../mod.ts';

type GuardInput = {
  readonly requested: string;
  readonly target: string;
  readonly recursive: boolean;
  readonly policy: t.PiSandboxFsExtension.Policy;
};

type GuardResult =
  | { readonly ok: true; readonly info: unknown }
  | { readonly ok: false; readonly reason: string };

type RegisteredRemoveTool = {
  readonly name: string;
  execute(
    toolCallId: string,
    params: { readonly path: string; readonly recursive?: boolean },
    signal: AbortSignal | undefined,
    onUpdate: unknown,
    ctx: { readonly cwd: string },
  ): Promise<{ readonly isError?: boolean; readonly details?: unknown }>;
};

type GeneratedSandboxFsModule = {
  readonly default: (pi: { registerTool(tool: RegisteredRemoveTool): void }) => void;
  readonly __sandboxFsTest: {
    readonly guardRemove: (input: GuardInput) => Promise<GuardResult>;
  };
};

describe(`Pi: sandbox filesystem extension`, () => {
  it('API', async () => {
    const m = await import('../mod.ts');
    expect(m.SandboxFs).to.equal(SandboxFs);
    expect(SandboxFs.resolvePolicy).to.equal(m.SandboxFs.resolvePolicy);
    expect(SandboxFs.toPromptArgs).to.equal(m.SandboxFs.toPromptArgs);
    expect(SandboxFs.write).to.equal(m.SandboxFs.write);
  });

  it('resolvePolicy → separates remove roots from protected runtime roots', async () => {
    const root = '/tmp/driver-pi-sandbox-fs' as t.StringDir;
    const policy = SandboxFs.resolvePolicy({
      cwd: { invoked: root, git: root },
      write: ['./profile-write' as t.StringPath, '/tmp/driver-pi-extra' as t.StringPath],
      remove: { enabled: true, recursive: false },
    });

    expect(policy).to.eql({
      enabled: true,
      recursive: false,
      removeRoots: [root, `${root}/profile-write`, '/tmp/driver-pi-extra'],
      protectedRoots: [
        `${root}/.git`,
        `${root}/.pi`,
        `${root}/.tmp/pi.cli`,
        `${root}/.tmp/pi.cli.pi`,
        `${root}/.log/@sys.driver-pi`,
        `${root}/.log/@sys.driver-pi.pi`,
      ],
    });
  });

  it('toPromptArgs → appends a truthful remove tool contract only when enabled', () => {
    const disabled = SandboxFs.toPromptArgs({
      enabled: false,
      recursive: false,
      removeRoots: [],
      protectedRoots: [],
    });
    expect(disabled).to.eql([]);

    const enabled = SandboxFs.toPromptArgs({
      enabled: true,
      recursive: false,
      removeRoots: ['/tmp/pi-root' as t.StringDir],
      protectedRoots: [],
    });
    expect(enabled[0]).to.eql('--append-system-prompt');
    expect(enabled[1]).to.contain('Runtime Tool Contract: remove');
    expect(enabled[1]).to.contain('- remove: Remove a file or directory path');
    expect(enabled[1]).to.contain('Bash is not a file deletion or cleanup fallback.');
    expect(enabled[1]).to.contain('Do not use `bash`, `rm`, `rmdir`, `unlink`');
    expect(enabled[1]).to.contain('If asked to delete and the callable `remove` tool is unavailable');
    expect(enabled[1]).to.contain('Do not fall back to `bash`.');
    expect(enabled[1]).to.contain('Recursive removal is disabled');
  });

  it('write → materializes the generated extension with resolved policy', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.sandbox-fs.test.' }))
      .absolute as t.StringDir;
    try {
      const policy = SandboxFs.resolvePolicy({
        cwd: { invoked: cwd, git: cwd },
        write: ['./src' as t.StringPath],
        remove: { enabled: true, recursive: true },
      });
      const res = await SandboxFs.write({ cwd, policy });
      const read = await Fs.readText(res.path);
      if (!read.ok) throw read.error;
      const text = read.data ?? '';

      expect(res.args).to.eql(['--extension', res.path]);
      expect(res.ops.some((op) => op.kind === 'create')).to.eql(true);
      expect(text).to.contain("name: 'remove'");
      expect(text).to.contain('"recursive": true');
      expect(text).to.contain('"removeRoots"');
      expect(text).to.contain(`${cwd}/src`);
      expect(text).not.to.contain('__SANDBOX_FS_POLICY__');
      expect(text).not.to.contain(`${cwd}/.pi/@sys/tmp`);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('generated remove tool → removes files and refuses protected paths', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.sandbox-fs.test.' }))
      .absolute as t.StringDir;
    try {
      const file = Fs.join(cwd, 'stale.txt') as t.StringPath;
      await Fs.write(file, 'old');
      await Fs.ensureDir(Fs.join(cwd, '.git'));

      const policy = SandboxFs.resolvePolicy({
        cwd: { invoked: cwd, git: cwd },
        remove: { enabled: true, recursive: false },
      });
      const res = await SandboxFs.write({ cwd, policy });
      const mod = await importGenerated(res.path);
      const tools: RegisteredRemoveTool[] = [];
      mod.default({ registerTool: (tool) => tools.push(tool) });

      const [tool] = tools;
      expect(tool.name).to.eql('remove');
      const removed = await tool.execute(
        'remove-1',
        { path: 'stale.txt' },
        undefined,
        undefined,
        { cwd },
      );
      expect(removed.isError).to.eql(undefined);
      expect(await Fs.exists(file)).to.eql(false);

      const blocked = await tool.execute(
        'remove-2',
        { path: '.git' },
        undefined,
        undefined,
        { cwd },
      );
      expect(blocked.isError).to.eql(true);
      expect(await Fs.exists(Fs.join(cwd, '.git'))).to.eql(true);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('generated guard → refuses traversal, globs, recursive symlinks, and intermediate symlinks', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.sandbox-fs.test.' }))
      .absolute as t.StringDir;
    const outside = (await Fs.makeTempDir({ prefix: 'driver-pi.sandbox-fs.outside.' }))
      .absolute as t.StringDir;
    try {
      await Fs.write(Fs.join(cwd, 'file.txt'), 'ok');
      await Fs.ensureDir(Fs.join(cwd, 'explicit-write-root'));
      await Fs.write(Fs.join(outside, 'outside.txt'), 'outside');
      await Deno.symlink(outside, Fs.join(cwd, 'link-parent'));
      await Deno.symlink(Fs.join(cwd, 'file.txt'), Fs.join(cwd, 'link-file'));

      const policy = SandboxFs.resolvePolicy({
        cwd: { invoked: cwd, git: cwd },
        remove: { enabled: true, recursive: false },
      });
      const res = await SandboxFs.write({ cwd, policy });
      const guardRemove = (await importGenerated(res.path)).__sandboxFsTest.guardRemove;

      const parent = await guardRemove({
        requested: '../outside.txt',
        target: Fs.join(outside, 'outside.txt'),
        recursive: false,
        policy,
      });
      expect(parent.ok).to.eql(false);
      if (!parent.ok) expect(parent.reason).to.contain('.. segments');

      const glob = await guardRemove({
        requested: '*.txt',
        target: Fs.join(cwd, '*.txt'),
        recursive: false,
        policy,
      });
      expect(glob.ok).to.eql(false);
      if (!glob.ok) expect(glob.reason).to.contain('glob-shaped');

      const withExplicitWriteRoot = SandboxFs.resolvePolicy({
        cwd: { invoked: cwd, git: cwd },
        write: ['./explicit-write-root' as t.StringPath],
        remove: { enabled: true, recursive: false },
      });
      const operationRoot = await guardRemove({
        requested: 'explicit-write-root',
        target: Fs.join(cwd, 'explicit-write-root'),
        recursive: false,
        policy: withExplicitWriteRoot,
      });
      expect(operationRoot.ok).to.eql(false);
      if (!operationRoot.ok) expect(operationRoot.reason).to.contain('operation root');

      const intermediate = await guardRemove({
        requested: 'link-parent/outside.txt',
        target: Fs.join(cwd, 'link-parent', 'outside.txt'),
        recursive: false,
        policy,
      });
      expect(intermediate.ok).to.eql(false);
      if (!intermediate.ok) expect(intermediate.reason).to.contain('intermediate symlink');

      const recursiveSymlink = await guardRemove({
        requested: 'link-file',
        target: Fs.join(cwd, 'link-file'),
        recursive: true,
        policy: { ...policy, recursive: true },
      });
      expect(recursiveSymlink.ok).to.eql(false);
      if (!recursiveSymlink.ok) {
        expect(recursiveSymlink.reason).to.contain('recursive removal of symlinks');
      }
    } finally {
      await Fs.remove(cwd);
      await Fs.remove(outside);
    }
  });
});

async function importGenerated(path: t.StringPath): Promise<GeneratedSandboxFsModule> {
  const url = Path.toFileUrl(path);
  url.search = `v=${Date.now()}.${Math.random()}`;
  return await import(url.href) as GeneratedSandboxFsModule;
}
