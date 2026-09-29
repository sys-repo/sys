import { Hash } from '@sys/crypto/hash';
import { Pkg as FsPkg } from '@sys/fs/pkg';
import { describe, expect, Fs, it, Json, type t } from '../../-test.ts';
import { type Fixture, setup, teardown } from '../../-test/u.fixture.dist.ts';
import { Dist, DistServer } from '../mod.ts';
import { materializeWith } from '../u.materialize/mod.ts';

/** A distinct supported document, retaining exactly the same payload descriptor. */
function replacement(fixture: Fixture): Uint8Array {
  const dist = fixture.cloneDist();
  dist.pkg = { name: '@different/label', version: '9.0.0' };
  return new TextEncoder().encode(Json.stringify(dist, 2));
}

async function replaceDocument(dir: string, bytes: Uint8Array) {
  const path = Fs.join(dir, 'dist.json');
  await Deno.chmod(path, 0o600);
  await Deno.writeFile(path, bytes);
}

function rootedWith(
  transform: (rooted: t.FsRooted.Instance) => t.FsRooted.Instance,
  failures: readonly t.FsRooted.Failure[] = [],
): t.FsRooted.Lib {
  const owner = Fs.Capability.Rooted;
  return Object.freeze({
    Is: Object.freeze({
      failure(input: unknown): input is t.FsRooted.Failure {
        return failures.includes(input as t.FsRooted.Failure) || owner.Is.failure(input);
      },
    }),
    create: async (options) => transform(await owner.create(options)),
  });
}

function committedFailure(): t.FsRooted.Failure {
  const error = new Error('Injected ambiguous promotion') as t.FsRooted.Failure;
  Object.defineProperties(error, {
    name: { value: 'FsRootedError' },
    operation: { value: 'promote-stage' },
    kind: { value: 'io-failure' },
    committed: { value: true },
  });
  return error;
}

describe('Server canonical content identity', () => {
  it('metadata-different downloads → same content address; warm reuse retains its own document', async () => {
    const fixture = await setup();
    try {
      const bytes = replacement(fixture);
      fixture.setManifestBytes(bytes);
      const first = await Dist.materialize(fixture.args());
      if (first.kind !== 'promoted') throw new Error(Json.stringify(first));
      expect(first.dir).to.eql(fixture.generationDir);
      expect(first.pin).to.eql(fixture.pin);
      expect(first.verification.content).to.eql(fixture.cloneDist().hash);
      expect(first.verification.manifestChecksum).to.eql(Hash.sha256(bytes));
      expect('dist' in first.verification).to.eql(false);
      const calls = fixture.calls.length;
      fixture.setManifest(fixture.cloneDist());
      const second = await Dist.materialize(fixture.args());
      if (second.kind !== 'existing') throw new Error(Json.stringify(second));
      expect(second.pin).to.eql(first.pin);
      expect(second.verification.manifestChecksum).to.eql(first.verification.manifestChecksum);
      expect(fixture.calls.length).to.eql(calls);
      expect(await Deno.readFile(Fs.join(second.dir, 'dist.json'))).to.eql(bytes);
    } finally {
      await teardown(fixture);
    }
  });

  it('old byte expectation → no acquisition; valid different content pin → no asset acquisition', async () => {
    const fixture = await setup();
    try {
      const { pin: _pin, ...base } = fixture.args();
      const old = { ...base, integrity: fixture.manifestChecksum };
      expect(await Dist.materialize(old as unknown as t.Dist.MaterializeArgs)).to.eql({
        kind: 'failed',
        stage: 'input',
        reason: 'invalid-input',
        cleanup: 'not-needed',
      });
      expect(fixture.calls).to.eql([]);
      const pin = { scheme: 'sys.dist/v2', digest: Hash.sha256('other') } as const;
      expect(await Dist.materialize(fixture.args({ pin }))).to.eql({
        kind: 'failed',
        stage: 'manifest-admission',
        reason: 'pin-mismatch',
        cleanup: 'not-needed',
      });
      expect(fixture.calls).to.eql(['/dist.json']);
      expect(await Fs.exists(fixture.generationDir)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('verification byte ceiling tighter than transport → manifest-fetch limit rejection', async () => {
    const fixture = await setup();
    try {
      fixture.policy.verification.manifestBytes = 8;
      fixture.respondToManifest(() => new Response('x'.repeat(4096)));
      expect(await Dist.materialize(fixture.args())).to.eql({
        kind: 'failed',
        stage: 'manifest-fetch',
        reason: 'limit-exceeded',
        cleanup: 'not-needed',
      });
      expect(fixture.calls).to.eql(['/dist.json']);
    } finally {
      await teardown(fixture);
    }
  });

  for (const changed of [false, true]) {
    it(`ambiguous post-publication error, document ${changed ? 'replaced' : 'unchanged'} → retained original fence`, async () => {
      const fixture = await setup();
      const cause = committedFailure();
      try {
        const rooted = rootedWith((root) => {
          return Object.freeze({
            ...root,
            Stage: Object.freeze({
              ...root.Stage,
              async promote(
                stage: t.FsRooted.Stage,
                target: t.FsRooted.Target<'directory'>,
                options?: t.FsRooted.PromotionOptions,
              ) {
                const result = await root.Stage.promote(stage, target, { ...options, seal: false });
                if (result.kind !== 'published') throw new Error('Expected publication.');
                if (changed) await replaceDocument(fixture.generationDir, replacement(fixture));
                throw cause;
              },
            }),
          });
        }, [cause]);
        const result = await materializeWith(fixture.args(), { rooted });
        if (changed) {
          expect(result).to.eql({
            kind: 'failed',
            stage: 'final-verification',
            reason: 'verification-failure',
            cleanup: 'complete',
            publication: 'occupied',
          });
          const fresh = await FsPkg.Dist.Pinned.verify({
            dir: fixture.generationDir,
            pin: fixture.pin,
            limits: fixture.policy.verification,
          });
          expect(fresh.kind).to.eql('verified');
          expect(await Deno.readFile(Fs.join(fixture.generationDir, 'dist.json'))).to.eql(
            replacement(fixture),
          );
        } else {
          if (result.kind !== 'existing') throw new Error(Json.stringify(result));
          expect(result.verification.manifestChecksum).to.eql(fixture.manifestChecksum);
          expect(result.totals).to.eql(undefined);
        }
      } finally {
        await teardown(fixture);
      }
    });
  }

  it('established separate equal-content winner → its own document baseline, never the losing download', async () => {
    const fixture = await setup();
    const gate = fixture.hold('/index.html');
    let pending: Promise<t.Dist.MaterializeResult> | undefined;
    try {
      pending = Dist.materialize(fixture.args());
      await gate.requested;
      await Fs.copyDir(fixture.source, fixture.generationDir, { throw: true });
      const bytes = replacement(fixture);
      await replaceDocument(fixture.generationDir, bytes);
      gate.release();
      const result = await pending;
      if (result.kind !== 'existing') throw new Error(Json.stringify(result));
      expect(result.verification.manifestChecksum).to.eql(Hash.sha256(bytes));
      expect(result.pin).to.eql(fixture.pin);
      expect(result.seal.kind).to.eql('applied');
    } finally {
      gate.release();
      await pending?.catch(() => undefined);
      await teardown(fixture);
    }
  });

  it('initially existing document replaced during sealing → refusal without resetting its baseline', async () => {
    const fixture = await setup();
    try {
      const first = await Dist.materialize(fixture.args());
      if (first.kind !== 'promoted') throw new Error(Json.stringify(first));
      const rooted = rootedWith((root) => {
        return Object.freeze({
          ...root,
          Tree: Object.freeze({
            ...root.Tree,
            async seal(
              target: t.FsRooted.OwnedTree,
              options?: t.FsRooted.OwnedTreeOptions,
            ) {
              await replaceDocument(fixture.generationDir, replacement(fixture));
              return await root.Tree.seal(target, options);
            },
          }),
        });
      });
      expect(await materializeWith(fixture.args(), { rooted })).to.eql({
        kind: 'failed',
        stage: 'final-verification',
        reason: 'verification-failure',
        cleanup: 'not-needed',
        publication: 'occupied',
      });
    } finally {
      await teardown(fixture);
    }
  });

  it('pinned host → asset-only; local host → exact retained document, refusing metadata replacement', async () => {
    const fixture = await setup();
    let pinned: t.DistServer.Started | undefined;
    let local: t.DistServer.Started | undefined;
    try {
      pinned = await DistServer.start({
        dir: fixture.source,
        pin: fixture.pin,
        limits: fixture.policy.verification,
        silent: true,
        keyboard: false,
      });
      expect(pinned.authority).to.eql({ kind: 'pinned', pin: fixture.pin });
      const hidden = await fetch(`${pinned.origin}/dist.json`);
      await hidden.arrayBuffer();
      expect(hidden.status).to.eql(404);
      const asset = await fetch(`${pinned.origin}/index.html`);
      expect(await asset.text()).to.eql('<h1>verified</h1>');
      local = await DistServer.Local.start({
        dir: fixture.source,
        limits: fixture.policy.verification,
        silent: true,
        keyboard: false,
      });
      expect(local.authority).to.eql({ kind: 'local-unpinned' });
      const document = await fetch(`${local.origin}/dist.json`);
      expect(new Uint8Array(await document.arrayBuffer())).to.eql(fixture.manifestBytes);
      await replaceDocument(fixture.source, replacement(fixture));
      const changed = await fetch(`${local.origin}/dist.json`);
      await changed.arrayBuffer();
      expect(changed.status).not.to.eql(200);
    } finally {
      await pinned?.close();
      await local?.close();
      await teardown(fixture);
    }
  });
});
