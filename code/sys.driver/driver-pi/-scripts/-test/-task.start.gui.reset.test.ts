import { describe, expect, it } from '../../src/-test.ts';
import { default as deno } from '../../deno.json' with { type: 'json' };
import { Cli, Err, Fs, type t } from '../common.ts';
import {
  GUI_RELEASE_STORE_ROOT,
  GUI_RELEASE_STORE_TARGETS,
  main,
  printGuiReleaseStoreReset,
  resetGuiReleaseStores,
} from '../task.start.gui.reset.ts';

const PACKAGE_ROOT: t.StringAbsoluteDir = Fs.resolve(import.meta.dirname ?? '.', '../..');
const TEST_TMP_ROOT: t.StringAbsoluteDir = Fs.join(PACKAGE_ROOT, '.tmp');
const EXPECTED_ROOT = '.pi/@sys/dist' as const;
const EXPECTED_TARGETS = ['@sys.driver-pi', '@sys/driver-pi'] as const;
const CURRENT = Object.freeze({
  target: EXPECTED_TARGETS[0],
  path: '.pi/@sys/dist/@sys.driver-pi' as const,
});
const LEGACY = Object.freeze({
  target: EXPECTED_TARGETS[1],
  path: '.pi/@sys/dist/@sys/driver-pi' as const,
});
const ANCESTORS = Object.freeze(
  [
    Object.freeze({ relative: '.pi', outsideSuffix: '@sys/dist' }),
    Object.freeze({ relative: '.pi/@sys', outsideSuffix: 'dist' }),
    Object.freeze({ relative: '.pi/@sys/dist', outsideSuffix: '' }),
  ] as const,
);
const CANONICAL_ABSENCE_CASES = Object.freeze(
  [
    Object.freeze({ present: undefined, missing: '.pi' }),
    Object.freeze({ present: '.pi', missing: '.pi/@sys' }),
    Object.freeze({ present: '.pi/@sys', missing: EXPECTED_ROOT }),
  ] as const,
);

describe('driver-pi/scripts/task.start.gui.reset', () => {
  it('pins exact store, operator task, process proof, and permission authority', () => {
    expect(GUI_RELEASE_STORE_ROOT).to.eql(EXPECTED_ROOT);
    expect(GUI_RELEASE_STORE_TARGETS).to.eql(EXPECTED_TARGETS);
    expect(Object.isFrozen(GUI_RELEASE_STORE_TARGETS)).to.eql(true);

    const tasks = deno.tasks as Record<string, string | undefined>;
    const permissions = deno.permissions as Record<string, Record<string, unknown> | undefined>;
    expect(tasks.reset).to.eql('deno task start:gui:reset');
    expect(tasks['start:gui:reset']).to.eql(
      'deno run -P=clean ./-scripts/task.start.gui.reset.ts',
    );
    expect(permissions.clean).to.eql({ read: true, write: true, env: true });
    expect(tasks.test).to.contain('deno task test:reset:process');
    expect(tasks['test:reset:process']).to.eql(
      'deno test --frozen --cached-only --no-prompt -P=test-reset-process --trace-leaks ./-scripts/-test.external/-task.start.gui.reset.process-proof.ts',
    );
    expect(permissions['test-reset-process']).to.eql({
      read: true,
      write: true,
      env: true,
      run: ['deno'],
    });
  });

  it('removes sealed current and legacy stores without changing neighboring state', async () => {
    const workspace = await temporaryWorkspace();
    const distRoot = await ensureDistRoot(workspace);
    const sibling = Fs.join(distRoot, 'unrelated/keep.txt');
    const profile = Fs.join(workspace, '-config/@sys.driver-pi/default.yaml');
    const outside = Fs.join(workspace, 'outside/keep.txt');

    try {
      await writeText(sibling, 'sibling');
      await writeText(profile, 'profile: default');
      await writeText(outside, 'outside');
      await createSealedStore(workspace, CURRENT.target, 'current');
      await createSealedStore(workspace, LEGACY.target, 'legacy');
      const locksBefore = await lockIdentities(distRoot);
      expect(locksBefore.length).to.eql(2);

      const results = await resetGuiReleaseStores(workspace);
      expect(results).to.eql([
        { path: CURRENT.path, kind: 'removed' },
        { path: LEGACY.path, kind: 'removed' },
      ]);
      const printed = printedReset(results);
      expect(printed.split('deleted').length - 1).to.eql(2);
      expect(printed).not.to.contain('already absent');

      expect(await Fs.exists(Fs.join(workspace, CURRENT.path))).to.eql(false);
      expect(await Fs.exists(Fs.join(workspace, LEGACY.path))).to.eql(false);
      expect(await Deno.readTextFile(sibling)).to.eql('sibling');
      expect(await Deno.readTextFile(profile)).to.eql('profile: default');
      expect(await Deno.readTextFile(outside)).to.eql('outside');
      expect(await lockIdentities(distRoot)).to.eql(locksBefore);
    } finally {
      await cleanupWorkspace(workspace);
    }
  });

  it('reports exact absence without creating any missing store-root segment', async () => {
    const workspace = await temporaryWorkspace();
    try {
      const results = await resetGuiReleaseStores(workspace);
      expect(results).to.eql([
        { path: CURRENT.path, kind: 'absent' },
        { path: LEGACY.path, kind: 'absent' },
      ]);

      const text = printedReset(results);
      expect(text).to.contain('Dist Reset (GUI)');
      expect(text).to.contain(CURRENT.path);
      expect(text).to.contain(LEGACY.path);
      expect(text.split('already absent').length - 1).to.eql(2);
      expect(await Fs.exists(Fs.join(workspace, EXPECTED_ROOT))).to.eql(false);
      expect(await Fs.exists(Fs.join(workspace, '.pi'))).to.eql(false);

      const output: string[] = [];
      const errors: string[] = [];
      const exitCode = await main(
        workspace,
        (...data) => output.push(data.map(String).join(' ')),
        (...data) => errors.push(data.map(String).join(' ')),
      );
      expect(exitCode).to.eql(0);
      expect(Cli.stripAnsi(output.join('\n'))).to.contain('Dist Reset (GUI)');
      expect(errors).to.eql([]);
    } finally {
      await cleanupWorkspace(workspace);
    }
  });

  it('returns an actionable ownership refusal instead of throwing', async () => {
    const workspace = await temporaryWorkspace();
    const root = await ensureDistRoot(workspace);
    const output: string[] = [];
    const errors: string[] = [];

    try {
      await createSealedStore(workspace, CURRENT.target, 'busy');
      const rooted = await Fs.Capability.Rooted.create({ root, create: false });
      const target = (await rooted.admit([
        { kind: 'directory', path: CURRENT.target },
      ])).targets[0];
      const acquired = await rooted.acquireLease([target], { mode: 'shared' });
      if (acquired.kind !== 'acquired') throw new Error('Expected reset fixture lease.');

      try {
        const exitCode = await main(
          workspace,
          (...data) => output.push(data.map(String).join(' ')),
          (...data) => errors.push(data.map(String).join(' ')),
        );
        const text = Cli.stripAnsi(errors.join('\n'));

        expect(exitCode).to.eql(1);
        expect(output).to.eql([]);
        expect(text).to.contain('Dist Reset Refused (GUI)');
        expect(text).to.contain(CURRENT.path);
        expect(text).to.contain('another operation owns this store');
        expect(text).to.contain('start:gui: q or Ctrl+C');
        expect(text).to.contain('deno task reset');
        expect(await Fs.exists(Fs.join(workspace, CURRENT.path))).to.eql(true);
      } finally {
        await acquired.lease.release();
      }
    } finally {
      await cleanupWorkspace(workspace);
    }
  });

  it('rethrows non-ownership failures without rendering a busy refusal', async () => {
    const workspace = await temporaryWorkspace();
    const output: string[] = [];
    const errors: string[] = [];
    await Fs.remove(workspace);

    const error = await rejectionOf(() =>
      main(
        workspace,
        (...data) => output.push(data.map(String).join(' ')),
        (...data) => errors.push(data.map(String).join(' ')),
      )
    );

    expect(error.message).to.contain('workspace root is missing');
    expect(output).to.eql([]);
    expect(errors).to.eql([]);
  });

  it('refuses redirected workspace ancestry before any missing segment settles absent', async () => {
    for (const scenario of CANONICAL_ABSENCE_CASES) {
      const base = await temporaryWorkspace();
      const realParent = Fs.join(base, 'real');
      const realWorkspace: t.StringAbsoluteDir = Fs.join(realParent, 'workspace');
      const aliasParent = Fs.join(base, 'alias');
      const aliasWorkspace: t.StringAbsoluteDir = Fs.join(aliasParent, 'workspace');

      try {
        await Fs.ensureDir(realWorkspace);
        if (scenario.present) await Fs.ensureDir(Fs.join(realWorkspace, scenario.present));
        await Deno.symlink(realParent, aliasParent, { type: 'dir' });

        const error = await rejectionOf(() => resetGuiReleaseStores(aliasWorkspace));
        expect(error.message).to.contain(aliasWorkspace);
        expect(error.message).to.contain('store-root ancestry is not canonical');
        expect(await Fs.exists(Fs.join(realWorkspace, scenario.missing))).to.eql(false);
        expect(await Fs.exists(Fs.join(realWorkspace, EXPECTED_ROOT, '.sys.rooted'))).to.eql(false);
      } finally {
        await Fs.remove(base);
      }
    }
  });

  it('refuses symlinked store-root ancestors without creating outside Rooted metadata', async () => {
    for (const ancestor of ANCESTORS) {
      const workspace = await temporaryWorkspace();
      const outsideWorkspace = await temporaryWorkspace();
      const link = Fs.join(workspace, ancestor.relative);
      const outside = Fs.join(
        outsideWorkspace,
        `redirect/${ancestor.relative.replaceAll('/', '-')}`,
      );
      const outsideRoot = Fs.join(outside, ancestor.outsideSuffix);
      const outsideFile = Fs.join(outsideRoot, CURRENT.target, 'keep.txt');

      try {
        await writeText(outsideFile, ancestor.relative);
        await Fs.ensureDir(Fs.dirname(link));
        await Deno.symlink(outside, link, { type: 'dir' });

        const error = await rejectionOf(() => resetGuiReleaseStores(workspace));
        expect(error.message).to.contain(link);
        expect(error.message).to.contain('store-root ancestry is a symlink');
        expect(await Deno.readTextFile(outsideFile)).to.eql(ancestor.relative);
        expect(await Fs.exists(Fs.join(outsideRoot, '.sys.rooted'))).to.eql(false);
      } finally {
        await Promise.all([
          cleanupWorkspace(workspace),
          Fs.remove(outsideWorkspace),
        ]);
      }
    }
  });

  it('refuses dangling store-root ancestors instead of reporting absence', async () => {
    for (const ancestor of ANCESTORS) {
      const workspace = await temporaryWorkspace();
      const link = Fs.join(workspace, ancestor.relative);
      const missing = Fs.join(workspace, `missing/${ancestor.relative.replaceAll('/', '-')}`);

      try {
        await Fs.ensureDir(Fs.dirname(link));
        await Deno.symlink(missing, link, { type: 'dir' });

        const error = await rejectionOf(() => resetGuiReleaseStores(workspace));
        expect(error.message).to.contain(link);
        expect(error.message).to.contain('store-root ancestry is a symlink');
        expect((await Fs.lstat(link))?.isSymlink).to.eql(true);
        expect(await Fs.exists(missing)).to.eql(false);
      } finally {
        await cleanupWorkspace(workspace);
      }
    }
  });

  it('refuses non-directory store-root ancestors', async () => {
    for (const ancestor of ANCESTORS) {
      const workspace = await temporaryWorkspace();
      const path = Fs.join(workspace, ancestor.relative);

      try {
        await writeText(path, 'not-a-directory');
        const error = await rejectionOf(() => resetGuiReleaseStores(workspace));
        expect(error.message).to.contain(path);
        expect(error.message).to.contain('store-root ancestry is not a directory');
        expect(await Deno.readTextFile(path)).to.eql('not-a-directory');
      } finally {
        await cleanupWorkspace(workspace);
      }
    }
  });

  it('refuses a complete store root reached through higher symlink ancestry', async () => {
    const base = await temporaryWorkspace();
    const realParent = Fs.join(base, 'real');
    const realWorkspace: t.StringAbsoluteDir = Fs.join(realParent, 'workspace');
    const aliasParent = Fs.join(base, 'alias');
    const aliasWorkspace: t.StringAbsoluteDir = Fs.join(aliasParent, 'workspace');
    const current = Fs.join(realWorkspace, CURRENT.path, 'keep.txt');

    try {
      await writeText(current, 'real-workspace');
      await Deno.symlink(realParent, aliasParent, { type: 'dir' });

      const error = await rejectionOf(() => resetGuiReleaseStores(aliasWorkspace));
      expect(error.message).to.contain(aliasWorkspace);
      expect(error.message).to.contain('store-root ancestry is not canonical');
      expect(await Deno.readTextFile(current)).to.eql('real-workspace');
      expect(await Fs.exists(Fs.join(realWorkspace, EXPECTED_ROOT, '.sys.rooted'))).to.eql(false);
    } finally {
      await Fs.remove(base);
    }
  });

  it('refuses canonical case aliases when the host exposes their true spelling', async () => {
    const base = await temporaryWorkspace();
    const workspace: t.StringAbsoluteDir = Fs.join(base, 'workspace-case');
    const alias: t.StringAbsoluteDir = Fs.join(base, 'WORKSPACE-CASE');

    try {
      await Fs.ensureDir(workspace);
      if (!(await Fs.lstat(alias))) return;
      if (await Fs.realPath(alias) === alias) return;

      const error = await rejectionOf(() => resetGuiReleaseStores(alias));
      expect(error.message).to.contain(alias);
      expect(error.message).to.contain('store-root ancestry is not canonical');
      expect(await Fs.exists(Fs.join(workspace, '.pi'))).to.eql(false);
    } finally {
      await Fs.remove(base);
    }
  });

  it('refuses a store target replaced by a symlink without removing outside bytes', async () => {
    const workspace = await temporaryWorkspace();
    const distRoot = await ensureDistRoot(workspace);
    const outside = Fs.join(workspace, 'outside/current');
    const outsideFile = Fs.join(outside, 'keep.txt');
    const sibling = Fs.join(distRoot, 'unrelated/keep.txt');
    const current = Fs.join(workspace, CURRENT.path);

    try {
      await writeText(outsideFile, 'outside');
      await writeText(sibling, 'sibling');
      await Fs.ensureDir(current);
      await Fs.remove(current);
      await Deno.symlink(outside, current, { type: 'dir' });

      const error = await rejectionOf(() => resetGuiReleaseStores(workspace));
      expect(error.message).to.contain('admit/unsafe-filesystem');
      expect(error.message).to.contain(CURRENT.path);
      expect((await Fs.lstat(current))?.isSymlink).to.eql(true);
      expect(await Deno.readTextFile(outsideFile)).to.eql('outside');
      expect(await Deno.readTextFile(sibling)).to.eql('sibling');
    } finally {
      await cleanupWorkspace(workspace);
    }
  });

  it('reports an actionable refusal when owned removal cannot begin', async () => {
    if (Deno.build.os === 'windows') return;
    const workspace = await temporaryWorkspace();
    const distRoot = await ensureDistRoot(workspace);
    const current = Fs.join(workspace, CURRENT.path);

    try {
      await createSealedStore(workspace, CURRENT.target, 'permission-refusal');
      await Deno.chmod(distRoot, 0o500);

      const error = await rejectionOf(() => resetGuiReleaseStores(workspace));
      expect(error.message).to.contain(CURRENT.path);
      expect(error.message).to.contain('remove-tree/permission-denied');
      expect(error.message).to.contain(
        'no owned removal committed; correct the filesystem state and retry',
      );
      expect(await Fs.exists(current)).to.eql(true);
      expect(await Deno.readTextFile(Fs.join(current, 'mixed/nested/value.txt'))).to.eql(
        'permission-refusal',
      );
    } finally {
      await Deno.chmod(distRoot, 0o700).catch(() => undefined);
      await cleanupWorkspace(workspace);
    }
  });
});

function printedReset(results: Parameters<typeof printGuiReleaseStoreReset>[0]): string {
  const printed: string[] = [];
  printGuiReleaseStoreReset(
    results,
    (...data) => printed.push(data.map(String).join(' ')),
  );
  return Cli.stripAnsi(printed.join('\n'));
}

async function temporaryWorkspace(): Promise<t.StringAbsoluteDir> {
  await Fs.ensureDir(TEST_TMP_ROOT);
  return (await Fs.makeTempDir({ dir: TEST_TMP_ROOT, prefix: 'driver-pi.reset.' })).absolute;
}

async function ensureDistRoot(workspace: t.StringAbsoluteDir): Promise<t.StringAbsoluteDir> {
  const root: t.StringAbsoluteDir = Fs.join(workspace, EXPECTED_ROOT);
  await Fs.ensureDir(root);
  return root;
}

async function createSealedStore(
  workspace: t.StringAbsoluteDir,
  targetPath: string,
  body: string,
): Promise<void> {
  const root = await ensureDistRoot(workspace);
  const target = Fs.join(root, targetPath);
  await writeText(Fs.join(target, 'mixed/nested/value.txt'), body);
  await writeText(Fs.join(target, 'dist.json'), '{}');

  const rooted = await Fs.Capability.Rooted.create({ root, create: false });
  const admission = await rooted.admit([{ kind: 'directory', path: targetPath }]);
  const sealed = await rooted.sealTree(admission.targets[0]);
  expect(sealed.kind).to.eql('applied');
}

async function writeText(path: t.StringPath, body: string): Promise<void> {
  await Fs.ensureDir(Fs.dirname(path));
  await Deno.writeTextFile(path, body);
}

async function lockIdentities(root: t.StringAbsoluteDir): Promise<readonly unknown[]> {
  const lockRoot = Fs.join(root, '.sys.rooted/locks');
  const identities: { path: string; dev: number | null; ino: number | null }[] = [];
  for await (const entry of Deno.readDir(lockRoot)) {
    if (!entry.isFile) continue;
    const info = await Deno.lstat(Fs.join(lockRoot, entry.name));
    identities.push({ path: entry.name, dev: info.dev, ino: info.ino });
  }
  return identities.sort((a, b) => a.path.localeCompare(b.path));
}

async function rejectionOf(operation: () => Promise<unknown>): Promise<Error> {
  try {
    await operation();
  } catch (cause) {
    return Err.std(cause) as Error;
  }
  throw new Error('Expected GUI Dist reset rejection.');
}

async function cleanupWorkspace(workspace: t.StringAbsoluteDir): Promise<void> {
  const distRoot = Fs.join(workspace, EXPECTED_ROOT);
  await Deno.chmod(distRoot, 0o700).catch(() => undefined);
  for (const descriptor of [CURRENT, LEGACY]) {
    const path = Fs.join(workspace, descriptor.path);
    const info = await Fs.lstat(path).catch(() => undefined);
    if (info?.isSymlink) await Deno.remove(path).catch(() => undefined);
  }
  await resetGuiReleaseStores(workspace).catch(() => undefined);
  await Fs.remove(workspace);
}
