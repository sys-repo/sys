import { describe, expect, expectTypeOf, Hash, it, type t } from '../../-test.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import { verifyLocalWithIo } from '../u.verify/u.pinned.ts';
import { limits, setup, teardown, withIo } from './-u.pinned.fixture.ts';

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

      expectTypeOf(local).toEqualTypeOf<t.Pkg.Dist.Local.Verify.Result>();
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
      const result = await verifyLocalWithIo(
        input as t.Pkg.Dist.Local.Verify.Args,
        io,
      );
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

function forbiddenIo() {
  const calls: string[] = [];
  const fail = (operation: string): never => {
    calls.push(operation);
    throw new Error(`Unexpected filesystem operation: ${operation}`);
  };
  const io = withIo({
    lstat: async () => fail('lstat'),
    open: async () => fail('open'),
    readDir: () => fail('readDir'),
    realPath: async () => fail('realPath'),
  });
  return { calls, io };
}
