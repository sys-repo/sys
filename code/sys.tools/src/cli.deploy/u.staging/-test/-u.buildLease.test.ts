import { Cli, describe, expect, expectError, Fs, it, Json, Path, Str } from '../../../-test.ts';
import { withTmpDir } from '../../-test/u.fixture.ts';
import { acquireStagingBuildLease, type StagingBuildLease } from '../u.buildLease.ts';
import { type PreparedStagingMapping, prepareStagingPlan } from '../u.prepare.ts';
import { stageMappings } from '../u.stageMappings.ts';

const compare = Str.Compare.codeUnit();
const DENIED_BUILD_CHILD = Path.fromFileUrl(
  new URL('./-u.buildLease.denied.process.ts', import.meta.url),
);

describe('Deploy build coordination containment', () => {
  it('leases source-owned dev state → leaves namespace parents unchanged', async () => {
    await withTmpDir(async (tmp) => {
      const parent = Fs.join(tmp, 'library');
      const source = Fs.join(parent, 'builder');
      const sibling = Fs.join(parent, 'sibling.txt');
      const cwd = Fs.join(tmp, 'endpoint');
      await Fs.ensureDir(source);
      await Fs.write(sibling, 'keep');
      const mappings = await prepare(cwd, [source]);
      const before = await children(parent);
      const held = await acquire(mappings);
      const state = Fs.join(source, '-dev/deploy/.sys.rooted/locks');
      try {
        expect(await children(parent)).to.eql(before);
        expect((await Fs.readText(sibling)).data).to.eql('keep');
        expect(await children(source)).to.eql(['-dev']);
        expect(await children(cwd)).to.eql([]);
        const locks = await children(state);
        expect(locks.length).to.eql(1);
        const lock = Fs.join(state, locks[0]!);
        const identity = await Fs.lstat(lock);
        expect(identity?.isFile).to.eql(true);
        await held.release();
        await held.release();
        expect(await children(state)).to.eql(locks);
        expect((await Fs.lstat(lock))?.ino).to.eql(identity?.ino);
        expect(await children(parent)).to.eql(before);
      } finally {
        await held.release();
      }
    });
  });

  it('denied dev-state writes → refusal without source-parent metadata or fallback', async () => {
    await withTmpDir(async (tmp) => {
      const parent = Fs.join(tmp, 'library');
      const source = Fs.join(parent, 'builder');
      await Fs.ensureDir(source);
      const output = await new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--check',
          '--quiet',
          '--cached-only',
          '--frozen',
          '--no-prompt',
          `--allow-read=${tmp}`,
          '--deny-write',
          DENIED_BUILD_CHILD,
          source,
        ],
        cwd: Fs.cwd(),
        stdin: 'null',
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      const decoder = new TextDecoder();
      const stderr = decoder.decode(output.stderr);
      if (!output.success || stderr !== '') {
        throw new Error(`Build ownership child failed (${output.code}).\n${stderr}`);
      }
      const report = Json.parse<{ ok: boolean; error?: string }>(decoder.decode(output.stdout));
      expect(report?.ok).to.eql(false);
      expect(report?.error).to.include('Requires write access');
      expect(report?.error).to.include(Fs.join(source, '-dev'));
      expect(await children(source)).to.eql([]);
      expect(await children(parent)).to.eql(['builder']);
      expect(await children(tmp)).to.eql(['library']);
    });
  });

  it('scratch cleanup preserves the held build lock across endpoint roots', async () => {
    await withTmpDir(async (tmp) => {
      const source = Fs.join(tmp, 'library/builder');
      await Fs.ensureDir(Fs.join(source, '.tmp'));
      await Fs.ensureDir(Fs.join(source, 'dist'));
      const a = await prepare(Fs.join(tmp, 'endpoint-a'), [source]);
      const b = await prepare(Fs.join(tmp, 'endpoint-b'), [source]);
      const held = await acquire(a);
      try {
        await Fs.remove(Fs.join(source, '.tmp'));
        await Fs.remove(Fs.join(source, 'dist'));
        await expectError(() => acquire(b), 'build source is already owned');
        expect(await children(Fs.join(tmp, 'library'))).to.eql(['builder']);
      } finally {
        await held.release();
      }
      await (await acquire(b)).release();
    });
  });

  it('orders sources independently of mappings → releases an acquired prefix on contention', async () => {
    await withTmpDir(async (tmp) => {
      const sourceA = Fs.join(tmp, 'library/a');
      const sourceB = Fs.join(tmp, 'library/b');
      await Fs.ensureDir(sourceA);
      await Fs.ensureDir(sourceB);
      const cwd = Fs.join(tmp, 'endpoint');
      const a = await prepare(cwd, [sourceA]);
      const b = await prepare(cwd, [sourceB]);
      const reversed = await prepare(cwd, [sourceB, sourceA]);
      const heldB = await acquire(b);
      try {
        await expectError(
          () => acquire(reversed),
          `already owned by another operation: ${sourceB}`,
        );
        // A was visited first despite the mapping order, and its partial lease was released.
        expect(await Fs.exists(Fs.join(sourceA, '-dev/deploy/.sys.rooted/locks'))).to.eql(true);
        await (await acquire(a)).release();
        expect(await children(Fs.join(tmp, 'library'))).to.eql(['a', 'b']);
      } finally {
        await heldB.release();
      }
      await (await acquire(reversed)).release();
    });
  });

  it('same-basename sources retain independent ownership', async () => {
    await withTmpDir(async (tmp) => {
      const a = Fs.join(tmp, 'a/builder');
      const b = Fs.join(tmp, 'b/builder');
      await Fs.ensureDir(a);
      await Fs.ensureDir(b);
      const heldA = await acquire(await prepare(Fs.join(tmp, 'endpoint-a'), [a]));
      try {
        await (await acquire(await prepare(Fs.join(tmp, 'endpoint-b'), [b]))).release();
      } finally {
        await heldA.release();
      }
    });
  });

  it({
    name: 'source aliases converge on canonical dev state',
    ignore: Deno.build.os === 'windows', // Unprivileged symlink creation is not portable.
    async fn() {
      await withTmpDir(async (tmp) => {
        const source = Fs.join(tmp, 'library/builder');
        const alias = Fs.join(tmp, 'alias');
        await Fs.ensureDir(source);
        await Fs.ensureSymlink(source, alias);
        const a = await prepare(Fs.join(tmp, 'endpoint-a'), [source]);
        const b = await prepare(Fs.join(tmp, 'endpoint-b'), [alias]);
        const held = await acquire(a);
        try {
          await expectError(() => acquire(b), `already owned by another operation: ${source}`);
          expect(await children(Fs.join(tmp, 'library'))).to.eql(['builder']);
          expect(await Fs.exists(Fs.join(tmp, '.sys.rooted'))).to.eql(false);
        } finally {
          await held.release();
        }
      });
    },
  });

  for (const relative of ['-dev', '-dev/deploy']) {
    it(`refuses a file at ${relative} without a parent-state fallback`, async () => {
      await withTmpDir(async (tmp) => {
        const source = Fs.join(tmp, 'library/builder');
        await Fs.ensureDir(source);
        const mappings = await prepare(Fs.join(tmp, 'endpoint'), [source]);
        const blocked = Fs.join(source, relative);
        await Fs.write(blocked, 'keep');
        await expectError(() => acquire(mappings), 'must be a canonical directory');
        expect((await Fs.readText(blocked)).data).to.eql('keep');
        expect(await children(Fs.join(tmp, 'library'))).to.eql(['builder']);
      });
    });

    it({
      name: `refuses a symlink at ${relative} without writing into its destination`,
      ignore: Deno.build.os === 'windows',
      async fn() {
        await withTmpDir(async (tmp) => {
          const source = Fs.join(tmp, 'library/builder');
          const outside = Fs.join(tmp, 'outside');
          await Fs.ensureDir(source);
          await Fs.ensureDir(outside);
          await Fs.write(Fs.join(outside, 'keep.txt'), 'keep');
          const mappings = await prepare(Fs.join(tmp, 'endpoint'), [source]);
          await Fs.ensureSymlink(outside, Fs.join(source, relative));
          await expectError(() => acquire(mappings), 'must be a canonical directory');
          expect(await children(outside)).to.eql(['keep.txt']);
          expect(await children(Fs.join(tmp, 'library'))).to.eql(['builder']);
        });
      },
    });
  }

  it('source replacement is refused before creating dev state', async () => {
    await withTmpDir(async (tmp) => {
      const source = Fs.join(tmp, 'library/builder');
      const displaced = Fs.join(tmp, 'displaced');
      await Fs.ensureDir(source);
      const mappings = await prepare(Fs.join(tmp, 'endpoint'), [source]);
      await Fs.rename(source, displaced);
      await Fs.ensureDir(source);
      await expectError(() => acquire(mappings), 'build source identity changed');
      expect(await children(source)).to.eql([]);
      expect(await children(displaced)).to.eql([]);
      expect(await children(Fs.join(tmp, 'library'))).to.eql(['builder']);
    });
  });

  it('coordination replacement is reported on release → the original lock still closes', async () => {
    await withTmpDir(async (tmp) => {
      const source = Fs.join(tmp, 'library/builder');
      await Fs.ensureDir(source);
      const mappings = await prepare(Fs.join(tmp, 'endpoint'), [source]);
      const held = await acquire(mappings);
      const state = Fs.join(source, '-dev/deploy');
      const displaced = Fs.join(tmp, 'displaced');
      try {
        await Fs.rename(state, displaced);
        await Fs.ensureDir(state);
        await expectError(() => held.release());
      } finally {
        // Release retains its failure, but must still close every owned descriptor.
        await held.release().catch(() => undefined);
        if (await Fs.exists(displaced)) {
          await Fs.remove(state);
          await Fs.rename(displaced, state);
        }
      }
      await (await acquire(mappings)).release();
      expect(await children(Fs.join(tmp, 'library'))).to.eql(['builder']);
    });
  });

  it('a failed source task releases build ownership without namespace-parent residue', async () => {
    await withTmpDir(async (tmp) => {
      const source = Fs.join(tmp, 'library/builder');
      const cwd = Fs.join(tmp, 'endpoint');
      await Fs.ensureDir(source);
      await Fs.writeJson(Fs.join(source, 'deno.json'), {
        name: 'deploy-failed-builder',
        version: '0.0.0',
        tasks: { test: `deno eval "throw new Error('fixture-build-failure')"` },
      });
      const mappings = await prepare(cwd, [source]);
      await expectError(() =>
        stageMappings({
          cwd,
          stagingRoot: 'stage',
          mappings: [{ mode: 'build+copy', dir: { source, staging: '.' } }],
        }), 'fixture-build-failure');
      await (await acquire(mappings)).release();
      expect(await children(Fs.join(tmp, 'library'))).to.eql(['builder']);
      expect(await Fs.exists(Fs.join(cwd, 'stage/dist.json'))).to.eql(false);
    });
  });

  it('already-cancelled acquisition and copy-only mappings create no coordination state', async () => {
    await withTmpDir(async (tmp) => {
      const source = Fs.join(tmp, 'library/builder');
      await Fs.ensureDir(source);
      const mappings = await prepare(Fs.join(tmp, 'endpoint'), [source]);
      const controller = new AbortController();
      controller.abort('before acquisition');
      await expectError(() => acquireStagingBuildLease({ mappings, signal: controller.signal }));
      const copy = mappings.map((mapping): PreparedStagingMapping =>
        mapping.mode === 'index' ? mapping : { ...mapping, mode: 'copy' }
      );
      expect(
        await acquireStagingBuildLease({
          mappings: copy,
          signal: new AbortController().signal,
        }),
      ).to.eql(undefined);
      expect(await children(source)).to.eql([]);
      expect(await children(Fs.join(tmp, 'library'))).to.eql(['builder']);
    });
  });
});

describe('Deploy build coordination publication selection', () => {
  it('workspace ignore policy excludes live coordination files from package publication', async () => {
    await withTmpDir(async (tmp) => {
      const source = Fs.join(tmp, 'builder');
      const policyPath = Path.fromFileUrl(new URL('../../../../../../.gitignore', import.meta.url));
      const policy = (await Fs.readText(policyPath)).data;
      if (!policy) throw new Error('Expected the workspace publication ignore policy.');
      const fixturePolicy = Fs.join(tmp, '.gitignore');
      await Fs.write(fixturePolicy, policy);
      await Fs.writeJson(Fs.join(source, 'deno.json'), {
        name: '@sys/deploy-coordination-fixture',
        version: '0.0.0',
        license: 'MIT',
        exports: './mod.ts',
      });
      await Fs.write(Fs.join(source, 'mod.ts'), 'export const value: number = 1;\n');
      const held = await acquire(await prepare(Fs.join(tmp, 'endpoint'), [source]));
      try {
        const locks = Fs.join(source, '-dev/deploy/.sys.rooted/locks');
        const files = await children(locks);
        expect(files.length).to.eql(1);
        const lockUrl = Path.toFileUrl(Fs.join(locks, files[0]!)).href;
        const selected = await dryRunPackage(source);
        expect(selected).to.include(Path.toFileUrl(Fs.join(source, 'mod.ts')).href);
        expect(selected).to.include(Path.toFileUrl(Fs.join(source, 'deno.json')).href);
        expect(selected).not.to.include('/-dev/');
        expect(selected).not.to.include('/.sys.rooted/');

        // Positive control: the same live lock enters the file set without the fixture's policy.
        // This changes only a disposable fixture, never the workspace's real ignore rules.
        await Fs.write(fixturePolicy, '');
        expect(await dryRunPackage(source)).to.include(lockUrl);
        expect(await children(locks)).to.eql(files);
      } finally {
        await held.release();
      }
    });
  });
});

/** Ask Deno for its actual package file set, without uploading anything. */
async function dryRunPackage(cwd: string): Promise<string> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['publish', '--dry-run'],
    cwd,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  const text = Cli.stripAnsi(decoder.decode(output.stdout) + decoder.decode(output.stderr));
  if (!output.success) throw new Error(`Package selection failed (${output.code}).\n${text}`);
  expect(text).to.include('Simulating publish');
  expect(text).to.include('Dry run complete');
  return text;
}

/** Prepare real canonical source identities without running a build task. */
async function prepare(
  cwd: string,
  sources: readonly string[],
): Promise<readonly PreparedStagingMapping[]> {
  await Fs.ensureDir(cwd);
  const result = await prepareStagingPlan({
    cwd,
    stagingRoot: 'stage',
    mappings: sources.map((source, index) => ({
      mode: 'build+copy',
      dir: { source, staging: `out-${index}` },
    })),
  });
  return result.mappings;
}

async function acquire(mappings: readonly PreparedStagingMapping[]): Promise<StagingBuildLease> {
  const lease = await acquireStagingBuildLease({
    mappings,
    signal: new AbortController().signal,
  });
  if (!lease) throw new Error('Expected build ownership.');
  return lease;
}

async function children(root: string): Promise<readonly string[]> {
  const names: string[] = [];
  for await (const entry of Fs.walk(root, { maxDepth: 1 })) {
    const name = Path.relative(root, entry.path);
    if (name) names.push(name);
  }
  return names.toSorted(compare);
}
