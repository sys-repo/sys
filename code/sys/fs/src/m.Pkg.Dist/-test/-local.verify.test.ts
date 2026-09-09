import { describe, expect, expectTypeOf, Hash, it, Num, StdPath, type t } from '../../-test.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import { Fs } from '../common.ts';
import { readLocalPartWithIo } from '../u.verify/u.pinned.part.ts';
import { verifyLocalWithIo } from '../u.verify/u.pinned.ts';
import {
  DEFAULT_IO,
  expectIoPathsWithin,
  fixturePart,
  type IoCall,
  limits,
  setup,
  teardown,
  traceIo,
  withIo,
} from './-u.pinned.fixture.ts';

describe('Pkg.Dist.Local.verify', () => {
  it('derives exact local manifest integrity and returns frozen pinned-parity evidence', async () => {
    const fixture = await setup();
    try {
      const exactManifest = new Uint8Array(fixture.manifest.byteLength + 1);
      exactManifest.set(fixture.manifest);
      exactManifest[exactManifest.byteLength - 1] = 0x0a;
      await Deno.writeFile(`${fixture.dir}/dist.json`, exactManifest);
      const exactIntegrity = Hash.sha256(exactManifest);

      const local = await Pkg.Dist.Local.verify({
        dir: fixture.dir,
        limits,
      });
      const pinned = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: exactIntegrity,
        limits,
      });

      type LocalHasPinnedMismatch = 'integrity-mismatch' extends t.Pkg.Dist.Local.Verify.FailureKind
        ? true
        : false;
      type PinnedHasPinnedMismatch = 'integrity-mismatch' extends
        t.Pkg.Dist.Pinned.Verify.FailureKind ? true : false;
      const localHasPinnedMismatch: LocalHasPinnedMismatch = false;
      const pinnedHasPinnedMismatch: PinnedHasPinnedMismatch = true;
      expectTypeOf(local).toEqualTypeOf<t.Pkg.Dist.Local.Verify.Result>();
      expectTypeOf(localHasPinnedMismatch).toEqualTypeOf<false>();
      expectTypeOf(pinnedHasPinnedMismatch).toEqualTypeOf<true>();
      expect(local.kind).to.eql('verified');
      if (local.kind !== 'verified') return;

      expect(pinned.kind).to.eql('verified');
      if (pinned.kind !== 'verified') return;

      expect(local.evidence.integrity).to.eql(exactIntegrity);
      expect(local.evidence.manifestBytes).to.eql(exactManifest.byteLength);
      expect(local.evidence.dist).to.eql(pinned.evidence.dist);
      expect(local.evidence.assets).to.eql(pinned.evidence.assets);
      expect(local.evidence.manifestBytes).to.eql(pinned.evidence.manifestBytes);

      const frozen = [
        local,
        local.evidence,
        local.evidence.assets,
        local.evidence.dist,
        local.evidence.dist.pkg!,
        local.evidence.dist.build,
        local.evidence.dist.build.size,
        local.evidence.dist.build.hash,
        local.evidence.dist.build.hash.ignore!,
        local.evidence.dist.build.hash.ignore!.rules,
        local.evidence.dist.hash,
        local.evidence.dist.hash.parts,
      ];
      expect(frozen.every(Object.isFrozen)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('keeps submitted verification paths at the selected root or below', async () => {
    const fixture = await setup();
    try {
      const calls: IoCall[] = [];
      const result = await verifyLocalWithIo(
        { dir: fixture.dir, limits },
        traceIo(calls),
      );

      expect(result.kind).to.eql('verified');
      expect(calls.length).to.be.greaterThan(0);
      expectIoPathsWithin(calls, fixture.dir);
    } finally {
      await teardown(fixture);
    }
  });

  it('resolves caller spelling before requiring a canonical root', async () => {
    const fixture = await setup();
    try {
      const dir = StdPath.relative(Fs.cwd(), fixture.dir);
      const calls: IoCall[] = [];
      const result = await verifyLocalWithIo({ dir, limits }, traceIo(calls));

      expect(result.kind).to.eql('verified');
      expect(calls.length).to.be.greaterThan(0);
      expectIoPathsWithin(calls, fixture.dir);
    } finally {
      await teardown(fixture);
    }
  });

  it('detects selected-root replacement after canonicalization', async () => {
    const fixture = await setup();
    try {
      let rootObservations = 0;
      const io = withIo({
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          if (path !== fixture.dir || ++rootObservations < 3) return info;
          if (!Num.Is.safeInt(info.ino)) throw new Error('Expected stable fixture inode.');
          const ino = info.ino === Num.MAX_INT ? info.ino - 1 : info.ino + 1;
          return { ...info, ino };
        },
      });

      const result = await verifyLocalWithIo({ dir: fixture.dir, limits }, io);
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(fixture);
    }
  });

  it('classifies root replacement during canonicalization as changed', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const verified = await verifyLocalWithIo(
        { dir: fixture.dir, limits },
        rootReplacementDuringCanonicalization(fixture.dir),
      );
      const read = await readLocalPartWithIo(
        part,
        rootReplacementDuringCanonicalization(fixture.dir),
      );

      expect(verified).to.eql({ kind: 'changed' });
      expect(read).to.eql({ kind: 'changed' });
    } finally {
      await teardown(fixture);
    }
  });

  it('sanitizes local root-resolution failures', async () => {
    const fixture = await setup();
    try {
      const io = withIo({
        realPath: () => Promise.reject(new Error(`private path: ${fixture.dir}`)),
      });
      const result = await verifyLocalWithIo({ dir: fixture.dir, limits }, io);

      expect(result).to.eql({ kind: 'io-failure' });
      expect(Object.keys(result)).to.eql(['kind']);
      expect(Object.isFrozen(result)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('reads checksum-matched files through the public Local surface', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const expected = await Deno.readFile(StdPath.join(fixture.dir, part.path));
      const result = await Pkg.Dist.Local.readPart(part);

      expectTypeOf(result).toEqualTypeOf<t.Pkg.Dist.Local.ReadPart.Result>();
      expect(result).to.eql({ kind: 'read', bytes: expected });
    } finally {
      await teardown(fixture);
    }
  });

  it('classifies root symlinks separately from canonical and ancestor aliases', async () => {
    const fixture = await setup();
    const rootAlias = `${fixture.dir}-alias`;
    const createdAliasWorkspace = await Deno.makeTempDir({ prefix: 'Pkg.Dist.Local.alias.' });
    const aliasWorkspace = await Deno.realPath(createdAliasWorkspace);
    try {
      await Deno.symlink(fixture.dir, rootAlias);
      const linkedParent = StdPath.join(aliasWorkspace, 'linked-parent');
      await Deno.symlink(StdPath.dirname(fixture.dir), linkedParent);
      const ancestorAlias = StdPath.join(linkedParent, StdPath.basename(fixture.dir));
      const part = fixturePart(fixture, 'assets/app.js');
      const aliases: Array<{
        readonly dir: string;
        readonly kind: 'symlink' | 'unsafe-path';
      }> = [
        { dir: rootAlias, kind: 'symlink' },
        { dir: ancestorAlias, kind: 'unsafe-path' },
      ];
      const caseAlias = await findCaseAlias(fixture.dir);
      if (caseAlias) aliases.push({ dir: caseAlias, kind: 'unsafe-path' });

      for (const { dir, kind } of aliases) {
        const verified = await Pkg.Dist.Local.verify({ dir, limits });
        const read = await Pkg.Dist.Local.readPart({ ...part, dir });
        expect([dir, verified]).to.eql([dir, { kind }]);
        expect([dir, read]).to.eql([dir, { kind }]);
      }
    } finally {
      await Deno.remove(rootAlias).catch(() => undefined);
      await Deno.remove(aliasWorkspace, { recursive: true });
      await teardown(fixture);
    }
  });

  it('rejects cross-mode, inherited, accessor, and malformed limit input before IO', async () => {
    const { calls, io } = forbiddenIo();
    const dir = '/unused';
    const symbol = Symbol('unknown');
    let getterCalls = 0;

    const accessorLimits = Object.defineProperty(
      {
        manifestBytes: limits.manifestBytes,
        fileBytes: limits.fileBytes,
        totalBytes: limits.totalBytes,
      },
      'entries',
      {
        enumerable: true,
        get() {
          getterCalls += 1;
          return limits.entries;
        },
      },
    );
    const inheritedLimits = Object.assign(
      Object.create({ entries: limits.entries }),
      {
        manifestBytes: limits.manifestBytes,
        fileBytes: limits.fileBytes,
        totalBytes: limits.totalBytes,
      },
    );
    const accessorArgs = Object.defineProperty({ limits }, 'dir', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return dir;
      },
    });
    const inheritedArgs = Object.assign(Object.create({ dir }), { limits });

    const inputs: unknown[] = [
      { dir, limits, integrity: 'cross-mode' },
      { dir, limits: { ...limits, unknown: true } },
      { dir, limits: { ...limits, [symbol]: true } },
      { dir, limits: accessorLimits },
      { dir, limits: inheritedLimits },
      accessorArgs,
      inheritedArgs,
      { dir, limits, until: {} },
    ];

    for (const input of inputs) {
      const result = await verifyLocalWithIo(input, io);
      expect(result).to.eql({ kind: 'invalid-input' });
    }
    expect(getterCalls).to.eql(0);
    expect(calls).to.eql([]);
  });

  it('performs no IO when pre-cancelled', async () => {
    const { calls, io } = forbiddenIo();
    const life = new AbortController();
    life.abort('before');

    const result = await verifyLocalWithIo(
      { dir: '/unused', limits, until: life.signal },
      io,
    );
    expect(result).to.eql({ kind: 'cancelled' });
    expect(calls).to.eql([]);
  });
});

/**
 * Helpers:
 */

async function findCaseAlias(dir: string): Promise<string | undefined> {
  const name = StdPath.basename(dir);
  const swapped = [...name].map((char) => {
    const lower = char.toLowerCase();
    const upper = char.toUpperCase();
    return char === lower ? upper : lower;
  }).join('');
  if (swapped === name) return;

  const candidate = StdPath.join(StdPath.dirname(dir), swapped);
  try {
    const [expected, alias] = await Promise.all([Deno.lstat(dir), Deno.lstat(candidate)]);
    return expected.dev === alias.dev && expected.ino === alias.ino ? candidate : undefined;
  } catch {
    return;
  }
}

function rootReplacementDuringCanonicalization(root: string) {
  let canonicalized = false;
  return withIo({
    async lstat(path) {
      const info = await DEFAULT_IO.lstat(path);
      if (path !== root || !canonicalized) return info;
      return { ...info, isDirectory: false, isSymlink: true };
    },
    async realPath(path) {
      if (path !== root) return await DEFAULT_IO.realPath(path);
      canonicalized = true;
      return `${root}-redirected`;
    },
  });
}

function forbiddenIo() {
  const calls: string[] = [];
  const error = (operation: string): Error => {
    calls.push(operation);
    return new Error(`Unexpected filesystem operation: ${operation}`);
  };
  const io = withIo({
    lstat: () => Promise.reject(error('lstat')),
    open: () => Promise.reject(error('open')),
    realPath: () => Promise.reject(error('realPath')),
    readDir() {
      throw error('readDir');
    },
  });
  return { calls, io };
}
