import { Hash } from '@sys/crypto/hash';
import { describe, expect, Fs, it, Json, type t, Time } from '../../-test.ts';
import { setup, teardown } from '../../-test/u.fixture.dist.ts';
import { Dist } from '../mod.ts';
import { materializeWith } from '../u.materialize/mod.ts';
import { snapshotAppliedSeal } from '../u.materialize/u.seal.ts';

describe('Dist.materialize', () => {
  describe('generation identity', () => {
    it('promotes once, returns final-directory evidence, then reuses without network', async () => {
      const fixture = await setup();
      try {
        const promoted = await Dist.materialize(fixture.args());
        expect(promoted.kind).to.eql('promoted');
        if (promoted.kind !== 'promoted') return;

        expect(promoted.dir).to.eql(Fs.join(fixture.storeDir, fixture.integrity));
        expect(promoted.integrity).to.eql(fixture.integrity);
        expect(promoted.verification.integrity).to.eql(fixture.integrity);
        expect(promoted.verification.assets.files).to.eql(fixture.assets.size);
        expect(promoted.seal).to.eql({ kind: 'applied', changed: true });
        expect(Object.isFrozen(promoted.seal)).to.eql(true);
        expect(promoted.cleanup).to.eql('complete');
        expect(promoted.totals.resources).to.eql(fixture.assets.size);
        expect(promoted.source.configuredUrl).to.not.include('?');
        expect(promoted.source.finalUrl).to.not.include('?');
        expect(Object.isFrozen(promoted.verification)).to.eql(true);
        expect(await Fs.exists(Fs.join(promoted.dir, 'dist.json'))).to.eql(true);

        const requests = fixture.calls.length;
        let credentials = 0;
        const existing = await Dist.materialize(fixture.args({
          credentials: {
            manifest: { accessToken: () => (credentials++, 'Bearer unused') },
          },
        }));
        expect(existing.kind).to.eql('existing');
        if (existing.kind !== 'existing') return;
        expect(existing.dir).to.eql(promoted.dir);
        expect(existing.verification.integrity).to.eql(fixture.integrity);
        expect(existing.seal).to.eql({ kind: 'applied', changed: false });
        expect(Object.isFrozen(existing.seal)).to.eql(true);
        expect(existing.cleanup).to.eql('not-needed');
        expect(existing.source).to.eql({ configuredUrl: promoted.source.configuredUrl });
        expect(credentials).to.eql(0);
        expect(fixture.calls.length).to.eql(requests);
      } finally {
        await teardown(fixture);
      }
    });

    it('resolves assets from the authenticated final manifest URL', async () => {
      const fixture = await setup();
      try {
        fixture.redirectManifest('/nested');
        const result = await Dist.materialize(fixture.args());
        expect(result.kind).to.eql('promoted');
        if (result.kind !== 'promoted') return;

        expect(fixture.calls.slice(0, 2)).to.eql(['/dist.json', '/nested/dist.json']);
        for (const path of fixture.assets.keys()) {
          const encoded = path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
          expect(fixture.calls).to.include(`/nested${encoded}`);
        }
        expect(result.source.finalUrl).to.match(/\/nested\/dist\.json$/);
        expect(result.source.finalUrl).to.not.include('redirected=private');
      } finally {
        await teardown(fixture);
      }
    });

    it('maps the same authenticated manifest bytes to one generation name across origins', async () => {
      const first = await setup();
      const second = await setup();
      try {
        second.setManifestBytes(first.manifestBytes);
        const [left, right] = await Promise.all([
          Dist.materialize(first.args()),
          Dist.materialize(second.args({ integrity: first.integrity })),
        ]);

        expect(left.kind).to.eql('promoted');
        expect(right.kind).to.eql('promoted');
        if (left.kind !== 'promoted' || right.kind !== 'promoted') return;
        expect(Fs.basename(left.dir)).to.eql(first.integrity);
        expect(Fs.basename(right.dir)).to.eql(first.integrity);
        expect(left.verification.integrity).to.eql(first.integrity);
        expect(right.verification.integrity).to.eql(first.integrity);
        expect(new URL(left.source.finalUrl).origin).to.not.eql(
          new URL(right.source.finalUrl).origin,
        );
      } finally {
        await teardown(second);
        await teardown(first);
      }
    });
  });

  describe('sealed generation lifecycle', () => {
    it('migrates one current-valid pre-sealing generation locally and re-verifies it', async () => {
      const fixture = await setup();
      try {
        const promoted = await Dist.materialize(fixture.args());
        expect(promoted.kind).to.eql('promoted');
        if (promoted.kind !== 'promoted') return;

        const manifest = Fs.join(promoted.dir, 'dist.json');
        await Deno.chmod(manifest, 0o600);
        const rooted = await Fs.Capability.Rooted.create({ root: fixture.storeDir });
        const admitted = await rooted.admit([
          { kind: 'directory', path: fixture.integrity },
        ]);
        expect(await rooted.inspectSeal(admitted.targets[0])).to.eql({ kind: 'unsealed' });

        const requests = fixture.calls.length;
        let credentials = 0;
        const existing = await Dist.materialize(fixture.args({
          credentials: {
            manifest: { accessToken: () => (credentials++, 'Bearer unused') },
          },
        }));

        expect(existing.kind).to.eql('existing');
        if (existing.kind !== 'existing') return;
        expect(existing.seal).to.eql({ kind: 'applied', changed: true });
        expect(existing.verification.integrity).to.eql(fixture.integrity);
        expect(await rooted.inspectSeal(admitted.targets[0])).to.eql({ kind: 'sealed' });
        expect(credentials).to.eql(0);
        expect(fixture.calls.length).to.eql(requests);
      } finally {
        await teardown(fixture);
      }
    });

    it('prevents ambient root and nested entries while preserving exact-tree refusal', async () => {
      const fixture = await setup();
      try {
        const promoted = await Dist.materialize(fixture.args());
        expect(promoted.kind).to.eql('promoted');
        if (promoted.kind !== 'promoted') return;

        await expectWriteDenied(() =>
          Deno.writeTextFile(Fs.join(promoted.dir, '.DS_Store'), 'ambient')
        );
        await expectWriteDenied(() =>
          Deno.writeTextFile(Fs.join(promoted.dir, 'assets', 'ambient.js'), 'ambient')
        );

        await Deno.chmod(promoted.dir, 0o700);
        await Deno.writeTextFile(Fs.join(promoted.dir, '.DS_Store'), 'ambient');
        const requests = fixture.calls.length;
        const result = await Dist.materialize(fixture.args());

        expect(result).to.eql({
          kind: 'failed',
          stage: 'existing-verification',
          reason: 'verification-failure',
          cleanup: 'not-needed',
          publication: 'occupied',
        });
        expect(fixture.calls.length).to.eql(requests);
        expect(await Fs.exists(Fs.join(promoted.dir, '.DS_Store'))).to.eql(true);
      } finally {
        await teardown(fixture);
      }
    });

    it('fails closed when sealing is unsupported before publication', async () => {
      const fixture = await setup();
      try {
        for (const committed of [false, true]) {
          const cause = rootedFailure(committed, 'unsupported', 'promote-stage');
          const replacement = rootedWith(
            (rooted) =>
              Object.freeze({
                ...rooted,
                promoteStage: async (stage: t.FsRooted.Stage) => {
                  await rooted.discardStage(stage);
                  throw cause;
                },
              }),
            [cause],
          );
          const result = await materializeWith(
            fixture.args(),
            Object.freeze({ rooted: replacement }),
          );

          expect(result).to.eql({
            kind: 'failed',
            stage: 'promotion',
            reason: 'unsupported',
            cleanup: 'complete',
          });
          expect(await Fs.exists(Fs.join(fixture.storeDir, fixture.integrity))).to.eql(false);
        }
      } finally {
        await teardown(fixture);
      }
    });

    it('preserves a newly published generation when sealing is unsupported and fails closed', async () => {
      const fixture = await setup();
      try {
        const replacement = rootedWith((rooted) =>
          Object.freeze({
            ...rooted,
            promoteStage: (
              stage: t.FsRooted.Stage,
              target: t.FsRooted.Target<'directory'>,
              options?: t.FsRooted.PromotionOptions,
            ) => rooted.promoteStage(stage, target, { ...options, seal: false }),
            sealTree: () => Promise.resolve(Object.freeze({ kind: 'unsupported' })),
          })
        );
        const result = await materializeWith(
          fixture.args(),
          Object.freeze({ rooted: replacement }),
        );

        const dir = Fs.join(fixture.storeDir, fixture.integrity);
        expect(result).to.eql({
          kind: 'failed',
          stage: 'sealing',
          reason: 'unsupported',
          cleanup: 'complete',
          publication: 'committed',
        });
        expect(await Fs.exists(dir)).to.eql(true);
      } finally {
        await teardown(fixture);
      }
    });

    it('fails closed when a current-valid generation cannot be sealed', async () => {
      const fixture = await setup();
      try {
        const promoted = await Dist.materialize(fixture.args());
        expect(promoted.kind).to.eql('promoted');
        if (promoted.kind !== 'promoted') return;
        await Deno.chmod(Fs.join(promoted.dir, 'dist.json'), 0o600);
        const requests = fixture.calls.length;

        const replacement = rootedWith((rooted) =>
          Object.freeze({
            ...rooted,
            sealTree: () => Promise.resolve(Object.freeze({ kind: 'unsupported' })),
          })
        );
        const result = await materializeWith(
          fixture.args(),
          Object.freeze({ rooted: replacement }),
        );

        expect(result).to.eql({
          kind: 'failed',
          stage: 'sealing',
          reason: 'unsupported',
          cleanup: 'not-needed',
          publication: 'occupied',
        });
        expect(fixture.calls.length).to.eql(requests);
        expect(await Fs.exists(promoted.dir)).to.eql(true);
      } finally {
        await teardown(fixture);
      }
    });

    it('accepts only exact lower applied-seal data evidence', () => {
      const valid = snapshotAppliedSeal({ kind: 'applied', changed: true });
      expect(valid).to.eql({ kind: 'applied', changed: true });
      expect(Object.isFrozen(valid)).to.eql(true);
      expect(snapshotAppliedSeal(undefined)).to.eql(undefined);
      expect(snapshotAppliedSeal({ kind: 'unsupported', changed: true })).to.eql(undefined);
      expect(snapshotAppliedSeal({ kind: 'applied', changed: 'yes' })).to.eql(undefined);
      expect(
        snapshotAppliedSeal(
          Object.defineProperty({ kind: 'applied' }, 'changed', {
            get: () => true,
          }),
        ),
      ).to.eql(undefined);
      expect(
        snapshotAppliedSeal(
          new Proxy({}, {
            getOwnPropertyDescriptor() {
              throw new Error('hostile seal evidence');
            },
          }),
        ),
      ).to.eql(undefined);
    });

    it('fails closed before mutation when seal inspection is unsupported', async () => {
      const fixture = await setup();
      try {
        const promoted = await Dist.materialize(fixture.args());
        expect(promoted.kind).to.eql('promoted');
        if (promoted.kind !== 'promoted') return;
        const manifest = Fs.join(promoted.dir, 'dist.json');
        await Deno.chmod(manifest, 0o600);
        let sealCalls = 0;

        const replacement = rootedWith((rooted) =>
          Object.freeze({
            ...rooted,
            inspectSeal: () => Promise.resolve(Object.freeze({ kind: 'unsupported' })),
            sealTree: (...args: Parameters<t.FsRooted.Instance['sealTree']>) => {
              sealCalls += 1;
              return rooted.sealTree(...args);
            },
          })
        );
        const result = await materializeWith(
          fixture.args(),
          Object.freeze({ rooted: replacement }),
        );

        expect(result).to.eql({
          kind: 'failed',
          stage: 'sealing',
          reason: 'unsupported',
          cleanup: 'not-needed',
          publication: 'occupied',
        });
        expect(sealCalls).to.eql(0);
        expect(((await Deno.lstat(manifest)).mode ?? 0) & 0o200).to.eql(0o200);
      } finally {
        await teardown(fixture);
      }
    });

    it('sanitizes cancellation reported while sealing an existing generation', async () => {
      const fixture = await setup();
      const cause = rootedFailure(false, 'cancelled', 'seal-tree');
      try {
        const promoted = await Dist.materialize(fixture.args());
        expect(promoted.kind).to.eql('promoted');
        if (promoted.kind !== 'promoted') return;
        await Deno.chmod(Fs.join(promoted.dir, 'dist.json'), 0o600);

        const replacement = rootedWith(
          (rooted) =>
            Object.freeze({
              ...rooted,
              sealTree: () => Promise.reject(cause),
            }),
          [cause],
        );
        const result = await materializeWith(
          fixture.args(),
          Object.freeze({ rooted: replacement }),
        );

        expect(result).to.eql({
          kind: 'failed',
          stage: 'sealing',
          reason: 'cancelled',
          cleanup: 'not-needed',
          publication: 'occupied',
        });
        expect(Json.stringify(result)).to.not.include('Rooted test failure');
      } finally {
        await teardown(fixture);
      }
    });

    it('snapshots lower applied-seal evidence before returning success', async () => {
      const fixture = await setup();
      let lowerSeal: { kind: 'applied'; changed: boolean } | undefined;
      try {
        const replacement = rootedWith((rooted) =>
          Object.freeze({
            ...rooted,
            promoteStage: async (...args: Parameters<t.FsRooted.Instance['promoteStage']>) => {
              const result = await rooted.promoteStage(...args);
              if (result.kind !== 'published') return result;
              lowerSeal = { kind: 'applied', changed: result.seal?.changed ?? true };
              return { ...result, seal: lowerSeal };
            },
          })
        );
        const result = await materializeWith(
          fixture.args(),
          Object.freeze({ rooted: replacement }),
        );
        expect(result.kind).to.eql('promoted');
        if (result.kind !== 'promoted' || !lowerSeal) return;

        lowerSeal.changed = false;
        expect(result.seal).to.eql({ kind: 'applied', changed: true });
        expect(Object.isFrozen(result.seal)).to.eql(true);
      } finally {
        await teardown(fixture);
      }
    });

    it('refuses success when a pre-sealing generation changes after sealing', async () => {
      const fixture = await setup();
      try {
        const promoted = await Dist.materialize(fixture.args());
        expect(promoted.kind).to.eql('promoted');
        if (promoted.kind !== 'promoted') return;
        const manifest = Fs.join(promoted.dir, 'dist.json');
        await Deno.chmod(manifest, 0o600);
        const requests = fixture.calls.length;

        const replacement = rootedWith((rooted) =>
          Object.freeze({
            ...rooted,
            sealTree: async (...args: Parameters<t.FsRooted.Instance['sealTree']>) => {
              const result = await rooted.sealTree(...args);
              await Deno.chmod(manifest, 0o600);
              await Deno.writeTextFile(manifest, '{}');
              return result;
            },
          })
        );
        const result = await materializeWith(
          fixture.args(),
          Object.freeze({ rooted: replacement }),
        );

        expect(result).to.eql({
          kind: 'failed',
          stage: 'final-verification',
          reason: 'integrity-mismatch',
          cleanup: 'not-needed',
          publication: 'occupied',
        });
        expect(fixture.calls.length).to.eql(requests);
      } finally {
        await teardown(fixture);
      }
    });

    it('retains exclusive generation ownership from sealing through final verification', async () => {
      const fixture = await setup();
      const sealed = deferred();
      const proceed = deferred();
      let pending: Promise<t.Dist.MaterializeResult> | undefined;
      try {
        const promoted = await Dist.materialize(fixture.args());
        expect(promoted.kind).to.eql('promoted');
        if (promoted.kind !== 'promoted') return;
        await Deno.chmod(Fs.join(promoted.dir, 'dist.json'), 0o600);

        const replacement = rootedWith((rooted) =>
          Object.freeze({
            ...rooted,
            sealTree: async (...args: Parameters<t.FsRooted.Instance['sealTree']>) => {
              const result = await rooted.sealTree(...args);
              sealed.resolve();
              await proceed.promise;
              return result;
            },
          })
        );
        pending = materializeWith(
          fixture.args(),
          Object.freeze({ rooted: replacement }),
        );
        await sealed.promise;

        const contender = await Fs.Capability.Rooted.create({ root: fixture.storeDir });
        const admitted = await contender.admit([
          { kind: 'directory', path: fixture.integrity },
        ]);
        const blocked = await contender.acquireLease(admitted.targets, { mode: 'exclusive' });
        if (blocked.kind === 'acquired') await blocked.lease.release();
        expect(blocked.kind).to.eql('busy');

        proceed.resolve();
        const result = await pending;
        expect(result.kind).to.eql('existing');
        if (result.kind === 'existing') {
          expect(result.seal).to.eql({ kind: 'applied', changed: true });
        }
      } finally {
        proceed.resolve();
        await pending?.catch(() => undefined);
        await teardown(fixture);
      }
    });

    it('does not bypass failed Rooted fixture removal with parent recursion', async () => {
      const fixture = await setup();
      let blocker: t.FsRooted.Lease | undefined;
      try {
        const result = await Dist.materialize(fixture.args());
        expect(result.kind).to.eql('promoted');
        if (result.kind !== 'promoted') return;

        const parent = Fs.dirname(fixture.storeDir) as t.StringDir;
        const rooted = await Fs.Capability.Rooted.create({ root: parent });
        const admitted = await rooted.admit([
          { kind: 'directory', path: Fs.basename(fixture.storeDir) },
        ]);
        const acquired = await rooted.acquireLease(admitted.targets, { mode: 'exclusive' });
        expect(acquired.kind).to.eql('acquired');
        if (acquired.kind !== 'acquired') return;
        blocker = acquired.lease;

        let failure: unknown;
        try {
          await fixture.dispose();
        } catch (cause) {
          failure = cause;
        }
        expect(failure instanceof Error).to.eql(true);
        expect(await Fs.exists(fixture.storeDir)).to.eql(true);
        expect(await Fs.exists(result.dir)).to.eql(true);
        expect(await Fs.exists(parent)).to.eql(true);
        expect(await Fs.exists(fixture.source)).to.eql(false);
      } finally {
        await blocker?.release();
        await teardown(fixture);
      }
    });

    it('removes the sealed representation only through lower owned removal', async () => {
      const fixture = await setup();
      try {
        const result = await Dist.materialize(fixture.args());
        expect(result.kind).to.eql('promoted');
        if (result.kind !== 'promoted') return;

        const rooted = await Fs.Capability.Rooted.create({ root: fixture.storeDir });
        const admitted = await rooted.admit([
          { kind: 'directory', path: fixture.integrity },
        ]);
        const target = admitted.targets[0];
        const acquired = await rooted.acquireLease([target], { mode: 'exclusive' });
        expect(acquired.kind).to.eql('acquired');
        if (acquired.kind !== 'acquired') return;
        try {
          expect(await rooted.removeTree(target, { lease: acquired.lease })).to.eql({
            kind: 'removed',
          });
        } finally {
          await acquired.lease.release();
        }
        expect(await Fs.exists(result.dir)).to.eql(false);
      } finally {
        await teardown(fixture);
      }
    });
  });

  describe('manifest trust and existing generations', () => {
    it('rejects a wrong external manifest pin without publishing a generation', async () => {
      const fixture = await setup();
      try {
        const integrity = Hash.sha256('not-the-manifest');
        const result = await Dist.materialize(fixture.args({ integrity }));
        expect(result).to.eql({
          kind: 'failed',
          stage: 'manifest-fetch',
          reason: 'integrity-mismatch',
          cleanup: 'not-needed',
        });
        expect(fixture.calls).to.eql(['/dist.json']);
        expect(await Fs.exists(Fs.join(fixture.storeDir, integrity))).to.eql(false);
        expect(Json.stringify(result)).to.not.include(integrity);
      } finally {
        await teardown(fixture);
      }
    });

    it('treats an existing generation without dist.json as occupied and performs no network work', async () => {
      const fixture = await setup();
      try {
        await Deno.mkdir(Fs.join(fixture.storeDir, fixture.integrity), { recursive: true });
        let credentials = 0;
        const policy: t.Dist.Policy = {
          ...fixture.policy,
          manifest: {
            ...fixture.policy.manifest,
            credentialOrigins: [...fixture.policy.manifest.sourceOrigins],
          },
        };
        const result = await Dist.materialize(fixture.args({
          policy,
          credentials: {
            manifest: { accessToken: () => (credentials++, 'secret-token') },
          },
        }));

        expect(result).to.eql({
          kind: 'failed',
          stage: 'existing-verification',
          reason: 'verification-failure',
          cleanup: 'not-needed',
          publication: 'occupied',
        });
        expect(credentials).to.eql(0);
        expect(fixture.calls).to.eql([]);
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects an invalid existing generation without credentials or network work', async () => {
      const fixture = await setup();
      try {
        const dir = Fs.join(fixture.storeDir, fixture.integrity);
        await Deno.mkdir(dir, { recursive: true });
        await Deno.writeTextFile(Fs.join(dir, 'dist.json'), '{}');
        let credentials = 0;
        const result = await Dist.materialize(fixture.args({
          credentials: {
            manifest: { accessToken: () => (credentials++, 'Bearer unused') },
          },
        }));

        expect(result).to.eql({
          kind: 'failed',
          stage: 'existing-verification',
          reason: 'integrity-mismatch',
          cleanup: 'not-needed',
          publication: 'occupied',
        });
        expect(credentials).to.eql(0);
        expect(fixture.calls).to.eql([]);
      } finally {
        await teardown(fixture);
      }
    });
  });

  describe('staging and generation isolation', () => {
    it('rejects excess authenticated resources before stage creation or asset transport', async () => {
      const fixture = await setup();
      try {
        const policy: t.Dist.Policy = {
          ...fixture.policy,
          resources: { ...fixture.policy.resources, maxResources: 0 },
        };
        const result = await Dist.materialize(fixture.args({ policy }));
        expect(result).to.eql({
          kind: 'failed',
          stage: 'manifest-admission',
          reason: 'limit-exceeded',
          cleanup: 'not-needed',
        });
        expect(fixture.calls).to.eql(['/dist.json']);
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects authenticated path escape before asset transport and cleans its stage', async () => {
      const fixture = await setup();
      try {
        const dist = fixture.cloneDist();
        const [path] = Object.keys(dist.hash.parts);
        const part = dist.hash.parts[path];
        delete dist.hash.parts[path];
        dist.hash.parts['../escape.js'] = part;
        fixture.setManifest(dist);

        const result = await Dist.materialize(fixture.args());
        expect(result).to.eql({
          kind: 'failed',
          stage: 'staging',
          reason: 'filesystem-failure',
          cleanup: 'complete',
        });
        expect(fixture.calls).to.eql(['/dist.json']);
        expect(await Fs.exists(Fs.join(fixture.storeDir, fixture.integrity))).to.eql(false);
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects authenticated target collisions before asset transport', async () => {
      const fixture = await setup();
      try {
        const dist = fixture.cloneDist();
        const nested = Object.entries(dist.hash.parts).find(([path]) => path.includes('/'));
        if (!nested) throw new Error('Expected one nested fixture asset.');
        const [path, part] = nested;
        dist.hash.parts[path.slice(0, path.indexOf('/'))] = part;
        fixture.setManifest(dist);

        const result = await Dist.materialize(fixture.args());
        expect(result).to.eql({
          kind: 'failed',
          stage: 'staging',
          reason: 'filesystem-failure',
          cleanup: 'complete',
        });
        expect(fixture.calls).to.eql(['/dist.json']);
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects authenticated parts without exact size before asset transport', async () => {
      const fixture = await setup();
      try {
        const dist = fixture.cloneDist();
        const [path] = Object.keys(dist.hash.parts);
        dist.hash.parts[path] = dist.hash.parts[path].split(':size=')[0] as t.StringHash;
        fixture.setManifest(dist);

        const result = await Dist.materialize(fixture.args());
        expect(result).to.eql({
          kind: 'failed',
          stage: 'manifest-admission',
          reason: 'malformed-manifest',
          cleanup: 'not-needed',
        });
        expect(fixture.calls).to.eql(['/dist.json']);
      } finally {
        await teardown(fixture);
      }
    });

    it('preserves prior verified generations when a later pinned generation fails', async () => {
      const fixture = await setup();
      try {
        const first = await Dist.materialize(fixture.args());
        expect(first.kind).to.eql('promoted');
        if (first.kind !== 'promoted') return;

        const originalDir = first.dir;
        const dist = fixture.cloneDist();
        dist.hash.digest = Hash.sha256('later-invalid-generation');
        fixture.setManifest(dist);
        const later = await Dist.materialize(fixture.args());

        expect(later.kind).to.eql('failed');
        expect(await Fs.exists(originalDir)).to.eql(true);
        expect(await Fs.exists(Fs.join(fixture.storeDir, fixture.integrity))).to.eql(false);
      } finally {
        await teardown(fixture);
      }
    });
  });

  describe('publication settlement', () => {
    it('does not infer promoted provenance from a committed error and visible target', async () => {
      const fixture = await setup();
      const cause = rootedFailure(true, 'io-failure', 'promote-stage');
      try {
        const replacement = rootedWith(
          (rooted) =>
            Object.freeze({
              ...rooted,
              promoteStage: async (
                stage: t.FsRooted.Stage,
                target: t.FsRooted.Target<'directory'>,
                options?: t.FsRooted.PromotionOptions,
              ) => {
                const result = await rooted.promoteStage(stage, target, {
                  ...options,
                  seal: false,
                });
                if (result.kind !== 'published') throw new Error('Expected visible publication.');
                throw cause;
              },
            }),
          [cause],
        );
        const result = await materializeWith(
          fixture.args(),
          Object.freeze({ rooted: replacement }),
        );

        expect(result.kind).to.eql('existing');
        if (result.kind !== 'existing') return;
        expect(result.source).to.eql({
          configuredUrl: new URL(fixture.manifestUrl).origin + '/dist.json',
        });
        expect(result.totals).to.eql(undefined);
        expect(result.seal.kind).to.eql('applied');
        expect(result.verification.integrity).to.eql(fixture.integrity);
      } finally {
        await teardown(fixture);
      }
    });

    it('retains exclusive generation ownership from publication through final verification', async () => {
      const fixture = await setup();
      const published = deferred();
      const proceed = deferred();
      let pending: Promise<t.Dist.MaterializeResult> | undefined;
      try {
        const replacement = rootedWith((rooted) =>
          Object.freeze({
            ...rooted,
            promoteStage: async (...args: Parameters<t.FsRooted.Instance['promoteStage']>) => {
              const result = await rooted.promoteStage(...args);
              if (result.kind === 'published') {
                published.resolve();
                await proceed.promise;
              }
              return result;
            },
          })
        );
        pending = materializeWith(
          fixture.args(),
          Object.freeze({ rooted: replacement }),
        );
        await published.promise;

        const contender = await Fs.Capability.Rooted.create({ root: fixture.storeDir });
        const admitted = await contender.admit([
          { kind: 'directory', path: fixture.integrity },
        ]);
        const blocked = await contender.acquireLease(admitted.targets, { mode: 'exclusive' });
        if (blocked.kind === 'acquired') await blocked.lease.release();
        expect(blocked.kind).to.eql('busy');

        proceed.resolve();
        const result = await pending;
        expect(result.kind).to.eql('promoted');
        if (result.kind === 'promoted') {
          expect(result.seal.kind).to.eql('applied');
        }
      } finally {
        proceed.resolve();
        await pending?.catch(() => undefined);
        await teardown(fixture);
      }
    });

    it('preserves verified committed truth when post-publication cleanup remains pending', async () => {
      const fixture = await setup();
      const owner = Fs.Capability.Rooted;
      const cleanupError = rootedFailure(true);
      const replacement: t.FsRooted.Lib = Object.freeze({
        Is: owner.Is,
        create: async (options) => {
          const rooted = await owner.create(options);
          const discardStage: t.FsRooted.Instance['discardStage'] = () => {
            return Promise.reject(rootedFailure(false));
          };
          const promoteStage: t.FsRooted.Instance['promoteStage'] = async (...args) => {
            const result = await rooted.promoteStage(...args);
            return result.kind === 'published'
              ? Object.freeze({ ...result, cleanupError })
              : result;
          };
          return Object.freeze({ ...rooted, discardStage, promoteStage });
        },
      });

      try {
        const result = await materializeWith(
          fixture.args(),
          Object.freeze({ rooted: replacement }),
        );
        expect(result.kind).to.eql('promoted');
        if (result.kind !== 'promoted') return;
        expect(result.dir).to.eql(Fs.join(fixture.storeDir, fixture.integrity));
        expect(result.cleanup).to.eql('pending');
        expect(result.verification.integrity).to.eql(fixture.integrity);
        expect(Fs.Capability.Rooted).to.equal(owner);
      } finally {
        await teardown(fixture);
      }
    });

    it('preserves committed truth when the final generation changes after publication', async () => {
      const fixture = await setup();
      try {
        const dir = Fs.join(fixture.storeDir, fixture.integrity);
        let settled = false;
        const pending = Dist.materialize(fixture.args()).finally(() => (settled = true));
        await waitForPath(dir);
        expect(settled).to.eql(false);
        await Deno.chmod(Fs.join(dir, 'dist.json'), 0o600);
        await Deno.writeTextFile(Fs.join(dir, 'dist.json'), '{}');
        const result = await pending;

        expect(result.kind).to.eql('failed');
        if (result.kind !== 'failed') return;
        expect(result.stage).to.eql('final-verification');
        expect(result.publication).to.eql('committed');
        expect(result.cleanup).to.eql('complete');
        expect(result.verification).to.eql(undefined);
        expect(await Fs.exists(dir)).to.eql(true);
      } finally {
        await teardown(fixture);
      }
    });

    it('does not rewrite a visible published generation as cancelled', async () => {
      const fixture = await setup();
      try {
        const dir = Fs.join(fixture.storeDir, fixture.integrity);
        const controller = new AbortController();
        let settled = false;
        const pending = Dist.materialize(fixture.args({ until: controller.signal })).finally(
          () => (settled = true),
        );
        await waitForPath(dir);
        expect(settled).to.eql(false);
        controller.abort('private-post-publication-reason');
        const result = await pending;

        expect(result.kind).to.eql('promoted');
        if (result.kind !== 'promoted') return;
        expect(result.dir).to.eql(dir);
        expect(result.verification.integrity).to.eql(fixture.integrity);
        expect(Json.stringify(result)).to.not.include('private-post-publication-reason');
      } finally {
        await teardown(fixture);
      }
    });

    it('reports an invalid concurrent winner as occupied without returning stage evidence', async () => {
      const fixture = await setup();
      const [path] = fixture.assets.keys();
      const gate = fixture.hold(path);
      try {
        const pending = Dist.materialize(fixture.args());
        await gate.requested;
        const dir = Fs.join(fixture.storeDir, fixture.integrity);
        const nested = Fs.join(dir, 'nested');
        const retained = Fs.join(nested, 'retained.txt');
        await Deno.mkdir(nested, { recursive: true });
        await Deno.writeTextFile(retained, 'invalid-winner');
        const modes = {
          root: (await Deno.lstat(dir)).mode,
          nested: (await Deno.lstat(nested)).mode,
          retained: (await Deno.lstat(retained)).mode,
        };
        gate.release();
        const result = await pending;

        expect(result).to.eql({
          kind: 'failed',
          stage: 'final-verification',
          reason: 'verification-failure',
          cleanup: 'complete',
          publication: 'occupied',
        });
        expect(await Fs.exists(dir)).to.eql(true);
        expect((await Deno.lstat(dir)).mode).to.eql(modes.root);
        expect((await Deno.lstat(nested)).mode).to.eql(modes.nested);
        expect((await Deno.lstat(retained)).mode).to.eql(modes.retained);
        expect(await Deno.readTextFile(retained)).to.eql('invalid-winner');
        expect(await Fs.exists(Fs.join(dir, 'dist.json'))).to.eql(false);
      } finally {
        gate.release();
        await teardown(fixture);
      }
    });

    it('settles concurrent materializers as one promoted and one freshly verified existing result', async () => {
      const fixture = await setup();
      try {
        const results = await Promise.all([
          Dist.materialize(fixture.args()),
          Dist.materialize(fixture.args()),
        ]);
        expect(results.map((result) => result.kind).sort()).to.eql(['existing', 'promoted']);
        results.forEach((result) => {
          expect(result.kind === 'failed').to.eql(false);
          if (result.kind === 'failed') return;
          expect(result.verification.integrity).to.eql(fixture.integrity);
          expect(result.seal.kind).to.eql('applied');
          expect(Object.isFrozen(result.seal)).to.eql(true);
          expect(result.dir).to.eql(Fs.join(fixture.storeDir, fixture.integrity));
        });
        expect(
          results.map((result) => result.kind === 'failed' ? undefined : result.seal.changed)
            .sort(),
        ).to.eql([false, true]);
      } finally {
        await teardown(fixture);
      }
    });
  });
});

function rootedFailure(
  committed: boolean,
  kind: t.FsRooted.FailureKind = 'io-failure',
  operation: t.FsRooted.Operation = 'discard-stage',
): t.FsRooted.Failure {
  const error = new Error('Rooted test failure') as t.FsRooted.Failure;
  Object.defineProperties(error, {
    name: { value: 'FsRootedError', enumerable: true },
    operation: { value: operation, enumerable: true },
    kind: { value: kind, enumerable: true },
    committed: { value: committed, enumerable: true },
  });
  return error;
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

function deferred(): { readonly promise: Promise<void>; readonly resolve: () => void } {
  let resolve = () => {};
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
}

async function expectWriteDenied(action: () => Promise<void>): Promise<void> {
  let cause: unknown;
  try {
    await action();
  } catch (error) {
    cause = error;
  }
  expect(cause instanceof Deno.errors.PermissionDenied).to.eql(true);
}

async function waitForPath(path: t.StringPath): Promise<void> {
  const startedAt = performance.now();
  while (!(await Fs.exists(path))) {
    if (performance.now() - startedAt > 2000) {
      throw new Error(`Timed out waiting for materialized path: ${path}`);
    }
    await Time.wait(1 as t.Msecs);
  }
}
