import { describe, expect, it } from '../../../../-test.ts';
import { Fs, Path, type t } from '../common.ts';
import { SandboxFs } from '../mod.ts';
import type { SandboxFsPolicy as GeneratedSandboxFsPolicy } from '../tmpl/t.ts';

type AssertAssignable<From, To> = From extends To ? true : never;

type RemoveGuardInput = {
  readonly requested: string;
  readonly target: string;
  readonly recursive: boolean;
  readonly policy: t.PiSandboxFsExtension.Policy;
};

type MoveGuardInput = {
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
  readonly policy: t.PiSandboxFsExtension.Policy;
};

type CopyGuardInput = {
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
  readonly policy: t.PiSandboxFsExtension.Policy;
};

type GuardResult =
  | { readonly ok: true; readonly info?: unknown }
  | { readonly ok: false; readonly reason: string };

type RegisteredTool = {
  readonly name: string;
  execute(
    toolCallId: string,
    params: Record<string, unknown>,
    signal: AbortSignal | undefined,
    onUpdate: unknown,
    ctx: { readonly cwd: string },
  ): Promise<{ readonly isError?: boolean; readonly details?: unknown }>;
};

type GeneratedSandboxFsModule = {
  readonly default: (pi: { registerTool(tool: RegisteredTool): void }) => void;
  readonly __sandboxFsTest: {
    readonly guardRemove: (input: RemoveGuardInput) => Promise<GuardResult>;
    readonly guardMove: (input: MoveGuardInput) => Promise<GuardResult>;
    readonly guardCopy: (input: CopyGuardInput) => Promise<GuardResult>;
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

  it('keeps host policy assignable to the generated standalone policy ABI', () => {
    const compatible: AssertAssignable<
      t.PiSandboxFsExtension.Policy,
      GeneratedSandboxFsPolicy
    > = true;

    expect(compatible).to.eql(true);
  });

  it('resolvePolicy → separates read roots, write roots, and protected runtime roots', async () => {
    const root = '/tmp/driver-pi-sandbox-fs' as t.StringDir;
    const policy = SandboxFs.resolvePolicy({
      cwd: { invoked: root, git: root },
      read: ['./profile-read' as t.StringPath, '/tmp/driver-pi-readable' as t.StringPath],
      write: ['./profile-write' as t.StringPath, '/tmp/driver-pi-extra' as t.StringPath],
      remove: { enabled: true, recursive: false },
      move: { enabled: true },
      copy: { enabled: true },
    });

    expect(policy).to.eql({
      readRoots: [root, `${root}/profile-read`, '/tmp/driver-pi-readable'],
      writeRoots: [root, `${root}/profile-write`, '/tmp/driver-pi-extra'],
      protectedRoots: [
        `${root}/.git`,
        `${root}/.pi`,
        `${root}/.tmp/pi.cli`,
        `${root}/.tmp/pi.cli.pi`,
        `${root}/.log/@sys.driver-pi`,
        `${root}/.log/@sys.driver-pi.pi`,
      ],
      remove: { enabled: true, recursive: false },
      move: { enabled: true },
      copy: { enabled: true },
    });
  });

  it('resolvePolicy → defaults wrapper-owned filesystem tools to enabled', () => {
    const root = '/tmp/driver-pi-sandbox-fs' as t.StringDir;
    const policy = SandboxFs.resolvePolicy({ cwd: { invoked: root, git: root } });

    expect(policy.remove).to.eql({ enabled: true, recursive: true });
    expect(policy.move).to.eql({ enabled: true });
    expect(policy.copy).to.eql({ enabled: true });
  });

  it('toPromptArgs → appends truthful contracts only for enabled tools', () => {
    const disabled = SandboxFs.toPromptArgs({
      readRoots: [],
      writeRoots: [],
      protectedRoots: [],
      remove: { enabled: false, recursive: false },
      move: { enabled: false },
      copy: { enabled: false },
    });
    expect(disabled).to.eql([]);

    const enabled = SandboxFs.toPromptArgs({
      readRoots: ['/tmp/pi-read' as t.StringPath],
      writeRoots: ['/tmp/pi-root' as t.StringPath],
      protectedRoots: [],
      remove: { enabled: true, recursive: false },
      move: { enabled: true },
      copy: { enabled: false },
    });
    expect(enabled[0]).to.eql('--append-system-prompt');
    expect(enabled[1]).to.contain('Runtime Tool Contract: remove');
    expect(enabled[1]).to.contain('Runtime Tool Contract: move');
    expect(enabled[1]).not.to.contain('Runtime Tool Contract: copy');
    expect(enabled[1]).to.contain('Bash is not a file deletion or cleanup fallback.');
    expect(enabled[1]).to.contain('Bash is not a file move/rename fallback.');
    expect(enabled[1]).to.contain('Recursive removal is disabled');
  });

  it('write → materializes the generated extension with resolved policy', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.sandbox-fs.test.' }))
      .absolute as t.StringDir;
    try {
      const policy = SandboxFs.resolvePolicy({
        cwd: { invoked: cwd, git: cwd },
        read: ['./readable' as t.StringPath],
        write: ['./src' as t.StringPath],
        remove: { enabled: true, recursive: true },
        move: { enabled: true },
        copy: { enabled: true },
      });
      const res = await SandboxFs.write({ cwd, policy });
      const mod = await Fs.readText(res.path);
      if (!mod.ok) throw mod.error;
      const modText = mod.data ?? '';
      const dir = Fs.dirname(res.path);
      const tool = await Fs.readText(Fs.join(dir, 'u.tool.ts'));
      if (!tool.ok) throw tool.error;
      const toolText = tool.data ?? '';
      const path = await Fs.readText(Fs.join(dir, 'u.path.ts'));
      if (!path.ok) throw path.error;
      const pathText = path.data ?? '';
      const schema = await Fs.readText(Fs.join(dir, 'u.schema.ts'));
      if (!schema.ok) throw schema.error;
      const schemaText = schema.data ?? '';
      const generatedText = [modText, toolText, pathText, schemaText].join('\n');

      expect(res.path).to.eql(Fs.join(cwd, '.pi', '@sys', 'extensions', 'sandbox.fs', 'mod.ts'));
      expect(res.args).to.eql(['--extension', res.path]);
      expect(res.ops.some((op) => op.kind === 'create')).to.eql(true);
      expect(toolText).to.contain("name: 'remove'");
      expect(toolText).to.contain("name: 'move'");
      expect(toolText).to.contain("name: 'copy'");
      expect(modText).to.contain('"recursive": true');
      expect(modText).to.contain('"readRoots"');
      expect(modText).to.contain('"writeRoots"');
      expect(modText).to.contain(`${cwd}/src`);
      expect(pathText).to.contain('Deno.lstat');
      expect(generatedText).not.to.contain("from '@sys/fs'");
      expect(generatedText).not.to.contain('@mariozechner/pi-coding-agent');
      expect(schemaText).not.to.contain("from 'typebox'");
      expect(generatedText).not.to.contain('__SANDBOX_FS_POLICY__');
      expect(generatedText).not.to.contain(`${cwd}/.pi/@sys/tmp`);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('generated tools → register enabled tools and execute remove, move, and copy', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.sandbox-fs.test.' }))
      .absolute as t.StringDir;
    const outside = (await Fs.makeTempDir({ prefix: 'driver-pi.sandbox-fs.read.' }))
      .absolute as t.StringDir;
    try {
      const allowed = Fs.join(cwd, 'allowed') as t.StringDir;
      const stale = Fs.join(cwd, 'stale.txt') as t.StringPath;
      const moveFrom = Fs.join(allowed, 'from.txt') as t.StringPath;
      const moveTo = Fs.join(allowed, 'to.txt') as t.StringPath;
      const copyFrom = Fs.join(outside, 'screen.png') as t.StringPath;
      const copyTo = Fs.join(allowed, 'screen.png') as t.StringPath;

      await Fs.ensureDir(allowed);
      await Fs.write(stale, 'old');
      await Fs.write(moveFrom, 'move me');
      await Fs.write(copyFrom, 'png bytes');

      const policy = SandboxFs.resolvePolicy({
        cwd: { invoked: cwd, git: cwd },
        read: [outside],
        write: ['./allowed' as t.StringPath],
        remove: { enabled: true, recursive: false },
        move: { enabled: true },
        copy: { enabled: true },
      });
      const res = await SandboxFs.write({ cwd, policy });
      const mod = await importGenerated(res.path);
      const tools: RegisteredTool[] = [];
      mod.default({ registerTool: (tool) => tools.push(tool) });

      expect(tools.map((tool) => tool.name)).to.eql(['remove', 'move', 'copy']);

      const remove = findTool(tools, 'remove');
      const removed = await remove.execute(
        'remove-1',
        { path: 'stale.txt' },
        undefined,
        undefined,
        { cwd },
      );
      expect(removed.isError).to.eql(undefined);
      expect(await Fs.exists(stale)).to.eql(false);

      const move = findTool(tools, 'move');
      const moved = await move.execute(
        'move-1',
        { from: 'allowed/from.txt', to: 'allowed/to.txt' },
        undefined,
        undefined,
        { cwd },
      );
      expect(moved.isError).to.eql(undefined);
      expect(await Fs.exists(moveFrom)).to.eql(false);
      expect((await Fs.readText(moveTo)).data).to.eql('move me');

      const copy = findTool(tools, 'copy');
      const copied = await copy.execute(
        'copy-1',
        { from: copyFrom, to: 'allowed/screen.png' },
        undefined,
        undefined,
        { cwd },
      );
      expect(copied.isError).to.eql(undefined);
      expect((await Fs.readText(copyFrom)).data).to.eql('png bytes');
      expect((await Fs.readText(copyTo)).data).to.eql('png bytes');
    } finally {
      await Fs.remove(cwd);
      await Fs.remove(outside);
    }
  });

  it('generated guards → refuse traversal, protected trees, bad destinations, and bad copy sources', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.sandbox-fs.test.' }))
      .absolute as t.StringDir;
    const outside = (await Fs.makeTempDir({ prefix: 'driver-pi.sandbox-fs.outside.' }))
      .absolute as t.StringDir;
    try {
      await Fs.write(Fs.join(cwd, 'file.txt'), 'ok');
      await Fs.ensureDir(Fs.join(cwd, 'explicit-write-root'));
      await Fs.ensureDir(Fs.join(cwd, '.tmp', 'pi.cli'));
      await Fs.write(Fs.join(outside, 'outside.txt'), 'outside');

      const policy = SandboxFs.resolvePolicy({
        cwd: { invoked: cwd, git: cwd },
        read: [outside],
        write: ['./explicit-write-root' as t.StringPath],
        remove: { enabled: true, recursive: true },
        move: { enabled: true },
        copy: { enabled: true },
      });
      const res = await SandboxFs.write({ cwd, policy });
      const guards = (await importGenerated(res.path)).__sandboxFsTest;

      const parent = await guards.guardMove({
        from: '../outside.txt',
        to: 'file-moved.txt',
        resolvedFrom: Fs.join(outside, 'outside.txt'),
        resolvedTo: Fs.join(cwd, 'file-moved.txt'),
        policy,
      });
      expect(parent.ok).to.eql(false);
      if (!parent.ok) expect(parent.reason).to.contain('.. segments');

      const protectedAncestor = await guards.guardRemove({
        requested: '.tmp',
        target: Fs.join(cwd, '.tmp'),
        recursive: true,
        policy,
      });
      expect(protectedAncestor.ok).to.eql(false);
      if (!protectedAncestor.ok) expect(protectedAncestor.reason).to.contain('protected');

      const operationRoot = await guards.guardMove({
        from: 'explicit-write-root',
        to: 'explicit-write-root-moved',
        resolvedFrom: Fs.join(cwd, 'explicit-write-root'),
        resolvedTo: Fs.join(cwd, 'explicit-write-root-moved'),
        policy,
      });
      expect(operationRoot.ok).to.eql(false);
      if (!operationRoot.ok) expect(operationRoot.reason).to.contain('operation root');

      const existingDestination = await guards.guardCopy({
        from: Fs.join(outside, 'outside.txt'),
        to: 'file.txt',
        resolvedFrom: Fs.join(outside, 'outside.txt'),
        resolvedTo: Fs.join(cwd, 'file.txt'),
        policy,
      });
      expect(existingDestination.ok).to.eql(false);
      if (!existingDestination.ok) expect(existingDestination.reason).to.contain('already exists');

      const directorySource = await guards.guardCopy({
        from: outside,
        to: 'copied-dir',
        resolvedFrom: outside,
        resolvedTo: Fs.join(cwd, 'copied-dir'),
        policy,
      });
      expect(directorySource.ok).to.eql(false);
      if (!directorySource.ok) expect(directorySource.reason).to.contain('regular file');
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

function findTool(tools: readonly RegisteredTool[], name: string) {
  const tool = tools.find((item) => item.name === name);
  if (!tool) throw new Error(`Missing generated sandbox filesystem tool: ${name}`);
  return tool;
}
