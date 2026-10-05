import { describe, Err, expect, Fs, Hash, Is, it, Json, Pkg, type t } from '../../../-test.ts';
import { withTmpDir } from '../../-test/u.fixture.ts';
import { copyInto, copyWithOwnership } from '../u.copyInto.ts';
import { finalizeDistTree } from '../u.finalizeDistTree.ts';
import { captureDirectoryIdentity } from '../u.identity.ts';
import { verifyStagedDist } from '../u.verifyStagedDist.ts';
import {
  createStagingManifestLedger,
  publishStagingManifest,
  removeStagingManifest,
  retainStagingManifest,
  retractStagingManifests,
  type StagingManifestRecord,
  validateStagingManifest,
} from '../u.manifest.ts';

// Deliberately not JSON: explicit I/O ownership reports bytes, not a valid content descriptor.
const partial = new Uint8Array([0xff, 0x00, 0x01]);

describe('Staging: manifest failure settlement', () => {
  it('modeled committed publication failure → report ownership, preserve cause, and retract the manifest', async () => {
    await withTmpDir(async (tmp) => {
      const root = `${tmp}/stage`;
      const target = `${root}/dist.json`;
      await Fs.write(`${root}/a.txt`, 'A', { throw: true });
      const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'root' });
      const ledger = createStagingManifestLedger();
      const original = new Error('Modeled post-publication cause.');
      const publicationFailure: t.FsRooted.Failure = Object.assign(
        new Error('Modeled publication settlement failed.', { cause: original }),
        {
          name: 'FsRootedError',
          operation: 'publish-file',
          kind: 'io-failure',
          committed: true,
        } as const,
      );
      const events: string[] = [];
      let expectedChecksum = '';
      // Fs owns actual post-link fault generation; Tools models its public failure contract here.
      const createRooted: t.FsRooted.Lib['create'] = async (options) => {
        const rooted = await Fs.Capability.Rooted.create(options);
        return {
          ...rooted,
          File: {
            async publish(handle, bytes, options) {
              await rooted.File.publish(handle, bytes, options);
              expect(await stagingManifestBytesChecksum(target)).to.eql(expectedChecksum);
              events.push('settlement:failed');
              throw publicationFailure;
            },
          },
        };
      };
      const caught = await failureOf(() =>
        finalizeDistTree({ dir: root, rootIdentity, manifestLedger: ledger }, {
          async publish(path, bytes, owned) {
            expectedChecksum = Hash.sha256(bytes);
            await publishStagingManifest(path, bytes, (checksum) => {
              events.push('owned');
              expect(checksum).to.eql(expectedChecksum);
              owned(checksum);
            }, createRooted);
          },
          async remove(record) {
            events.push('rollback');
            expect(record.manifestChecksum).to.eql(expectedChecksum);
            expect(record.directoryIdentity).to.eql(rootIdentity);
            await removeStagingManifest(record);
          },
        })
      );
      expect(caught).to.equal(publicationFailure);
      if (!Fs.Capability.Rooted.Is.failure(caught)) throw new Error('Expected Rooted failure.');
      expect(caught.operation).to.eql('publish-file');
      expect(caught.committed).to.eql(true);
      expect(caught.cause).to.equal(original);
      expect(events).to.eql(['settlement:failed', 'owned', 'rollback']);
      expect(ledger.size).to.eql(0);
      expect(await Fs.exists(target)).to.eql(false);
      expect((await Fs.readText(`${root}/a.txt`)).data).to.eql('A');
    });
  });

  for (const kind of ['uncommitted', 'generic'] as const) {
    it(`modeled ${kind} publication failure → no ownership report or rollback of foreign bytes`, async () => {
      await withTmpDir(async (tmp) => {
        const root = `${tmp}/stage`;
        const target = `${root}/dist.json`;
        await Fs.write(`${root}/a.txt`, 'A', { throw: true });
        const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'root' });
        const ledger = createStagingManifestLedger();
        const original = new Error('Modeled publication cause.');
        const uncommitted: t.FsRooted.Failure = Object.assign(
          new Error('Modeled uncommitted publication failure.', { cause: original }),
          {
            name: 'FsRootedError',
            operation: 'publish-file',
            kind: 'io-failure',
            committed: false,
          } as const,
        );
        const failure = kind === 'uncommitted' ? uncommitted : original;
        let reports = 0;
        let removals = 0;
        let foreign = new Uint8Array();
        const createRooted: t.FsRooted.Lib['create'] = async (options) => {
          const rooted = await Fs.Capability.Rooted.create(options);
          return {
            ...rooted,
            File: {
              async publish(handle, bytes) {
                // Model another writer's equal bytes, not ownership by this publication attempt.
                foreign = bytes.slice();
                await Fs.write(Fs.join(rooted.path, handle.path), foreign, { throw: true });
                throw failure;
              },
            },
          };
        };
        const caught = await failureOf(() =>
          finalizeDistTree({ dir: root, rootIdentity, manifestLedger: ledger }, {
            async publish(path, bytes, owned) {
              await publishStagingManifest(path, bytes, (checksum) => {
                reports++;
                owned(checksum);
              }, createRooted);
            },
            async remove(record) {
              removals++;
              await removeStagingManifest(record);
            },
          })
        );
        expect(caught).to.equal(failure);
        expect(Fs.Capability.Rooted.Is.failure(caught)).to.eql(kind === 'uncommitted');
        expect(reports).to.eql(0);
        expect(removals).to.eql(0);
        expect(ledger.size).to.eql(0);
        await retractStagingManifests(ledger);
        expect((await Fs.read(target)).data).to.eql(foreign);
      });
    });
  }

  it('retained directory replaced with byte-identical manifest → cleanup refuses the foreign directory', async () => {
    await withTmpDir(async (tmp) => {
      const root = `${tmp}/stage`;
      const displaced = `${tmp}/displaced`;
      const target = `${root}/dist.json`;
      await Fs.write(`${root}/a.txt`, 'A', { throw: true });
      const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'root' });
      const ledger = createStagingManifestLedger();
      const finalized = await finalizeDistTree({ dir: root, rootIdentity, manifestLedger: ledger });
      const read = await Fs.read(target);
      if (!read.ok || !read.data) throw new Error('Expected retained manifest bytes.');
      await Fs.rename(root, displaced);
      await Fs.write(target, read.data, { throw: true });
      const checksum = await stagingManifestBytesChecksum(target);
      expect(checksum).to.eql(finalized.rootManifest.manifestChecksum);

      const caught = await failureOf(() => retractStagingManifests(ledger));
      const expected = `Deploy staging manifest directory identity changed: ${root}`;
      expect(messageOf(caught)).to.eql(expected);
      expect(ledger.get(root)).to.equal(finalized.rootManifest);
      expect((await Fs.read(target)).data).to.eql(read.data);
      expect((await Fs.read(`${displaced}/dist.json`)).data).to.eql(read.data);
    });
  });

  for (
    const [label, copier] of [['copy', Fs.copyFile], ['publication', copyWithOwnership]] as const
  ) {
    it(`untouched ${label} collision → no deletion authority over foreign manifest bytes`, async () => {
      await withTmpDir(async (tmp) => {
        const src = `${tmp}/src`;
        const dst = `${tmp}/dst`;
        await Fs.write(`${src}/dist.json`, 'source', { throw: true });
        await Fs.ensureDir(dst);
        const sourceIdentity = await captureDirectoryIdentity({ path: src, label: 'source' });
        const destinationIdentity = await captureDirectoryIdentity({
          path: dst,
          label: 'destination',
        });
        const ledger = createStagingManifestLedger();
        let original: unknown;
        const caught = await failureOf(() =>
          copyInto({
            src,
            dst,
            sourceIdentity,
            destinationIdentity,
            manifestLedger: ledger,
          }, async (from, to, options, owned) => {
            await Fs.write(to, 'foreign', { throw: true });
            try {
              return await copier(from, to, options, owned);
            } catch (error) {
              original = error;
              throw error;
            }
          })
        );
        expect(caught).to.equal(original);
        expect(ledger.size).to.eql(0);
        await retractStagingManifests(ledger);
        expect((await Fs.readText(`${dst}/dist.json`)).data).to.eql('foreign');
      });
    });
  }

  for (const equal of [false, true]) {
    it(`failed finalizer write, foreign ${equal ? 'equal' : 'different'} bytes → no deletion authority`, async () => {
      await withTmpDir(async (tmp) => {
        const root = `${tmp}/stage`;
        const target = `${root}/dist.json`;
        await Fs.write(`${root}/a.txt`, 'A', { throw: true });
        const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'root' });
        const ledger = createStagingManifestLedger();
        const failure = Err.std('Write refused before acquiring ownership.');
        let foreign = new Uint8Array();
        const caught = await failureOf(() =>
          finalizeDistTree({ dir: root, rootIdentity, manifestLedger: ledger }, {
            async publish(path, data) {
              foreign = equal ? data.slice() : new TextEncoder().encode('foreign');
              await Fs.write(path, foreign, { throw: true });
              throw failure;
            },
            remove: removeStagingManifest,
          })
        );
        expect(caught).to.equal(failure);
        expect(ledger.size).to.eql(0);
        await retractStagingManifests(ledger);
        expect((await Fs.read(target)).data).to.eql(foreign);
      });
    });
  }

  for (const retained of [false, true]) {
    for (const equal of [false, true]) {
      it(`finalizer publication collision, prior ownership ${retained}, equal bytes ${equal} → preserve the winner`, async () => {
        await withTmpDir(async (tmp) => {
          const root = `${tmp}/stage`;
          const target = `${root}/dist.json`;
          await Fs.write(`${root}/a.txt`, 'A', { throw: true });
          const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'root' });
          const ledger = createStagingManifestLedger();
          if (retained) {
            const computed = await Pkg.Dist.compute({ dir: root, save: true });
            if (computed.kind !== 'computed') throw computed.error;
            retainStagingManifest({
              ledger,
              directoryIdentity: rootIdentity,
              manifestChecksum: computed.manifestChecksum,
            });
          }
          let foreign = new Uint8Array();
          let reports = 0;
          let original: unknown;
          const caught = await failureOf(() =>
            finalizeDistTree({ dir: root, rootIdentity, manifestLedger: ledger }, {
              async publish(path, bytes, owned) {
                expect(await Fs.exists(path)).to.eql(false);
                foreign = equal ? bytes.slice() : new TextEncoder().encode('foreign');
                await Fs.write(path, foreign, { throw: true });
                try {
                  await publishStagingManifest(path, bytes, (checksum) => {
                    reports++;
                    owned(checksum);
                  });
                } catch (error) {
                  original = error;
                  throw error;
                }
              },
              remove: removeStagingManifest,
            })
          );
          expect(caught).to.equal(original);
          expect(Fs.Capability.Rooted.Is.failure(caught)).to.eql(true);
          if (!Fs.Capability.Rooted.Is.failure(caught)) throw new Error('Expected collision.');
          expect(caught.kind).to.eql('occupied');
          expect(caught.committed).not.to.eql(true);
          expect(reports).to.eql(0);
          expect(ledger.size).to.eql(0);
          await retractStagingManifests(ledger);
          expect((await Fs.read(target)).data).to.eql(foreign);
        });
      });
    }
  }

  for (const replaced of [false, true]) {
    it(`finalizer publication settles then fails, replacement ${replaced} → retain original ownership only`, async () => {
      await withTmpDir(async (tmp) => {
        const root = `${tmp}/stage`;
        const target = `${root}/dist.json`;
        await Fs.write(`${root}/a.txt`, 'A', { throw: true });
        const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'root' });
        const ledger = createStagingManifestLedger();
        const failure = new Error('Publication settlement failed.');
        let originalChecksum = '';
        let removals = 0;
        const caught = await failureOf(() =>
          finalizeDistTree({ dir: root, rootIdentity, manifestLedger: ledger }, {
            async publish(path, bytes, owned) {
              originalChecksum = Hash.sha256(bytes);
              await publishStagingManifest(path, bytes, owned);
              if (replaced) await Fs.write(path, 'foreign', { throw: true });
              throw failure;
            },
            async remove(record) {
              removals++;
              expect(record.manifestChecksum).to.eql(originalChecksum);
              await removeStagingManifest(record);
            },
          })
        );
        expect(ledger.size).to.eql(0);
        if (replaced) {
          const aggregate = aggregateOf(caught);
          expect(aggregate.cause).to.equal(failure);
          expect(aggregate.errors.length).to.eql(2);
          expect(aggregate.errors[0]).to.equal(failure);
          expect(messageOf(aggregate.errors[1])).to.eql(changed(target));
          expect(removals).to.eql(0);
          expect((await Fs.readText(target)).data).to.eql('foreign');
        } else {
          expect(caught).to.equal(failure);
          expect(removals).to.eql(1);
          expect(await Fs.exists(target)).to.eql(false);
        }
      });
    });
  }

  it('async finalizer hook → settle its original rejection before manifest cleanup', async () => {
    await withTmpDir(async (tmp) => {
      const root = `${tmp}/stage`;
      const child = `${root}/nested`;
      await Fs.write(`${child}/a.txt`, 'A', { throw: true });
      const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'root' });
      const ledger = createStagingManifestLedger();
      const original = new Error('Asynchronous finalizer hook refused.');
      const calls: string[] = [];
      const caught = await failureOf(() =>
        finalizeDistTree({
          dir: root,
          rootIdentity,
          manifestLedger: ledger,
          hooks: {
            async afterManifest(dir) {
              expect(dir).to.eql(child);
              calls.push('hook:start');
              const manifest = await Fs.readJson(`${dir}/dist.json`);
              expect(Pkg.Is.dist(manifest.data)).to.eql(true);
              calls.push('hook:end');
              throw original;
            },
          },
        }, {
          publish: publishStagingManifest,
          async remove(record) {
            calls.push('remove');
            await removeStagingManifest(record);
          },
        })
      );
      expect(caught).to.equal(original);
      expect(calls).to.eql(['hook:start', 'hook:end', 'remove']);
      expect(ledger.size).to.eql(0);
      expect(await Fs.exists(`${child}/dist.json`)).to.eql(false);
      expect(await Fs.exists(`${root}/dist.json`)).to.eql(false);
    });
  });

  for (const replace of [false, true]) {
    it(`successful child cleanup, root replacement ${replace} → retain original document fence`, async () => {
      await withTmpDir(async (tmp) => {
        const root = `${tmp}/stage`;
        await Fs.write(`${root}/nested/a.txt`, 'A', { throw: true });
        const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'root' });
        const ledger = createStagingManifestLedger();
        let replacement = '';
        let original: StagingManifestRecord | undefined;
        const run = () =>
          finalizeDistTree({ dir: root, rootIdentity, manifestLedger: ledger }, {
            publish: publishStagingManifest,
            async remove(record) {
              original = ledger.get(root);
              if (replace) {
                const dist = (await Fs.readJson(`${root}/dist.json`)).data;
                if (!Pkg.Is.dist(dist)) throw new Error('Expected root manifest.');
                replacement = Json.stringify({
                  ...dist,
                  pkg: { name: '@foreign/root', version: '1' },
                });
                await Fs.write(`${root}/dist.json`, replacement, { throw: true });
              }
              await removeStagingManifest(record);
            },
          });
        if (replace) {
          const error = await failureOf(run);
          expect(messageOf(error)).to.eql(changed(`${root}/dist.json`));
          expect(ledger.get(root)).to.equal(original);
          expect((await Fs.readText(`${root}/dist.json`)).data).to.eql(replacement);
        } else {
          const finalized = await run();
          expect(finalized.rootManifest).to.equal(original);
          await validateStagingManifest(finalized.rootManifest);
        }
        expect(await Fs.exists(`${root}/nested/dist.json`)).to.eql(false);
      });
    });
  }

  it('final verification handoff → cannot renew a replaced root document', async () => {
    await withTmpDir(async (tmp) => {
      const root = `${tmp}/stage`;
      await Fs.write(`${root}/a.txt`, 'A', { throw: true });
      const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'root' });
      const finalized = await finalizeDistTree({ dir: root, rootIdentity });
      const dist = (await Fs.readJson(`${root}/dist.json`)).data;
      if (!Pkg.Is.dist(dist)) throw new Error('Expected root manifest.');
      const replacement = Json.stringify({ ...dist, pkg: { name: '@foreign/root', version: '1' } });
      await Fs.write(`${root}/dist.json`, replacement, { throw: true });
      // The replacement remains locally consistent, but cannot replace the operation's document.
      expect((await verifyStagedDist(root)).content.digest).to.eql(dist.hash.digest);
      const error = await failureOf(() =>
        verifyStagedDist(root, undefined, finalized.rootManifest)
      );
      expect(messageOf(error)).to.eql(changed(`${root}/dist.json`));
      expect((await Fs.readText(`${root}/dist.json`)).data).to.eql(replacement);
    });
  });

  for (const mode of ['throw', 'return'] as const) {
    for (const retainable of [true, false]) {
      it(`copy ${mode}, ${retainable ? 'regular residue' : 'unsafe residue'} → exact retention or paired failure`, async () => {
        await withTmpDir(async (tmp) => {
          const src = `${tmp}/src`;
          const dst = `${tmp}/dst`;
          const target = `${dst}/dist.json`;
          const outside = `${tmp}/foreign.json`;
          await Fs.write(`${src}/dist.json`, 'complete source', { throw: true });
          await Fs.write(outside, partial, { throw: true });
          await Fs.ensureDir(dst);
          const sourceIdentity = await captureDirectoryIdentity({
            path: src,
            label: 'test source',
          });
          const destinationIdentity = await captureDirectoryIdentity({
            path: dst,
            label: 'test destination',
          });
          const ledger = createStagingManifestLedger();
          const failure = Err.std('Fixture manifest copy failed.');
          let copies = 0;
          const caught = await failureOf(() =>
            copyInto(
              { src, dst, sourceIdentity, destinationIdentity, manifestLedger: ledger },
              async (from, to, options, owned) => {
                copies++;
                expect(from).to.eql(`${src}/dist.json`);
                expect(to).to.eql(target);
                expect(options).to.eql({ ensureParent: false, force: false, throw: true });
                if (retainable) await Fs.write(to, partial, { throw: true });
                else await Fs.ensureSymlink(outside, to);
                // The seam reports bytes it produced; collision controls never make this report.
                owned(Hash.sha256(partial));
                if (mode === 'throw') throw failure;
                return { error: failure };
              },
            )
          );
          expect(copies).to.eql(1);
          expect((await Fs.readText(`${src}/dist.json`)).data).to.eql('complete source');
          expect((await Fs.read(outside)).data).to.eql(partial);
          if (retainable) {
            expect(caught).to.equal(failure);
            const record = ledger.get(dst);
            if (!record) throw new Error('Expected exact failed-copy ownership.');
            expect(record.path).to.eql(target);
            expect(record.directoryIdentity).to.equal(destinationIdentity);
            expect(record.manifestChecksum).to.eql(Hash.sha256(partial));
            expect(Object.isFrozen(record)).to.eql(true);
            expect((await Fs.read(target)).data).to.eql(partial);
            await validateStagingManifest(record);
            await retractStagingManifests(ledger);
            expect(await Fs.exists(target)).to.eql(false);
            expect(ledger.size).to.eql(0);
          } else {
            const aggregate = aggregateOf(caught);
            expect(aggregate.message).to.eql(
              'Deploy staging manifest copy failed and its resulting bytes could not be retained.',
            );
            expect(aggregate.cause).to.equal(failure);
            expect(aggregate.errors.length).to.eql(2);
            expect(aggregate.errors[0]).to.equal(failure);
            expect(messageOf(aggregate.errors[1])).to.eql(changed(target));
            expect(ledger.size).to.eql(0);
            await retractStagingManifests(ledger);
            expect((await Fs.lstat(target))?.isSymlink).to.eql(true);
            expect((await Fs.read(outside)).data).to.eql(partial);
          }
        });
      });
    }
  }

  for (const mode of ['throw', 'return'] as const) {
    it(`copy ${mode}, residue observation rejects → original cause and foreign bytes survive`, async () => {
      await withTmpDir(async (tmp) => {
        const src = `${tmp}/src`;
        const dst = `${tmp}/dst`;
        const displaced = `${tmp}/displaced`;
        const sentinel = 'replacement is not our directory';
        await Fs.write(`${src}/dist.json`, 'source', { throw: true });
        await Fs.ensureDir(dst);
        const sourceIdentity = await captureDirectoryIdentity({ path: src, label: 'test source' });
        const destinationIdentity = await captureDirectoryIdentity({
          path: dst,
          label: 'test destination',
        });
        const ledger = createStagingManifestLedger();
        const failure = Err.std('Fixture copy failed before residue observation.');
        let copies = 0;
        const caught = await failureOf(() =>
          copyInto(
            { src, dst, sourceIdentity, destinationIdentity, manifestLedger: ledger },
            async (from, to, options, owned) => {
              copies++;
              expect(from).to.eql(`${src}/dist.json`);
              expect(to).to.eql(`${dst}/dist.json`);
              expect(options).to.eql({ ensureParent: false, force: false, throw: true });
              await Fs.write(to, partial, { throw: true });
              owned(Hash.sha256(partial));
              await Fs.rename(dst, displaced);
              await Fs.write(dst, sentinel, { throw: true });
              if (mode === 'throw') throw failure;
              return { error: failure };
            },
          )
        );
        expect(copies).to.eql(1);
        const aggregate = aggregateOf(caught);
        expect(aggregate.message).to.eql(
          'Deploy staging manifest copy failed and its resulting bytes could not be retained.',
        );
        expect(aggregate.cause).to.equal(failure);
        expect(aggregate.errors.length).to.eql(2);
        expect(aggregate.errors[0]).to.equal(failure);
        expect(aggregate.errors[1]).to.be.instanceOf(Deno.errors.NotADirectory);
        expect(ledger.size).to.eql(0);
        await retractStagingManifests(ledger);
        expect((await Fs.readText(dst)).data).to.eql(sentinel);
        expect((await Fs.read(`${displaced}/dist.json`)).data).to.eql(partial);
        expect((await Fs.readText(`${src}/dist.json`)).data).to.eql('source');
      });
    });
  }

  for (const name of ['dist.json', 'asset.txt']) {
    it(`copy failure without owned ${name} residue → original failure, no invented ledger entry`, async () => {
      await withTmpDir(async (tmp) => {
        const src = `${tmp}/src`;
        const dst = `${tmp}/dst`;
        await Fs.write(`${src}/${name}`, 'source', { throw: true });
        await Fs.ensureDir(dst);
        const sourceIdentity = await captureDirectoryIdentity({ path: src, label: 'test source' });
        const destinationIdentity = await captureDirectoryIdentity({
          path: dst,
          label: 'test destination',
        });
        const ledger = createStagingManifestLedger();
        const failure = new Error('Fixture copy failed.');
        const caught = await failureOf(() =>
          copyInto(
            { src, dst, sourceIdentity, destinationIdentity, manifestLedger: ledger },
            async (_from, to) => {
              // Ordinary payload residue must not become manifest-deletion authority either.
              if (name === 'asset.txt') await Fs.write(to, partial, { throw: true });
              throw failure;
            },
          )
        );
        expect(caught).to.equal(failure);
        expect(ledger.size).to.eql(0);
        await retractStagingManifests(ledger);
        expect(await Fs.exists(`${dst}/dist.json`)).to.eql(false);
        if (name === 'asset.txt') expect((await Fs.read(`${dst}/${name}`)).data).to.eql(partial);
      });
    });
  }

  for (const retainable of [true, false]) {
    it(`failed manifest write, ${retainable ? 'regular residue' : 'unsafe residue'} → retained rollback or paired failure`, async () => {
      await withTmpDir(async (tmp) => {
        const root = `${tmp}/stage`;
        const target = `${root}/dist.json`;
        const outside = `${tmp}/foreign.json`;
        await Fs.write(`${root}/a.txt`, 'A', { throw: true });
        await Fs.write(outside, partial, { throw: true });
        const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'test root' });
        const ledger = createStagingManifestLedger();
        const failure = Err.std('Fixture manifest write failed.');
        const removed: StagingManifestRecord[] = [];
        let writes = 0;
        const caught = await failureOf(() =>
          finalizeDistTree({ dir: root, rootIdentity, manifestLedger: ledger }, {
            async publish(path, data, owned) {
              writes++;
              expect(path).to.eql(target);
              expect(Pkg.Is.dist(Json.parse(new TextDecoder().decode(data)))).to.eql(true);
              if (retainable) await Fs.write(path, partial, { throw: true });
              else await Fs.ensureSymlink(outside, path);
              // Explicit fault-seam ownership; real publication never exposes a partial file.
              owned(Hash.sha256(partial));
              throw failure;
            },
            async remove(record) {
              removed.push(record);
              expect(record).to.equal(ledger.get(root));
              expect(record.directoryIdentity).to.eql(rootIdentity);
              expect(record.manifestChecksum).to.eql(Hash.sha256(partial));
              expect((await Fs.read(record.path)).data).to.eql(partial);
              await removeStagingManifest(record);
            },
          })
        );
        expect(writes).to.eql(1);
        expect(ledger.size).to.eql(0);
        expect((await Fs.read(outside)).data).to.eql(partial);
        if (retainable) {
          expect(caught).to.equal(failure);
          expect(removed.length).to.eql(1);
          expect(Object.isFrozen(removed[0])).to.eql(true);
          expect(await Fs.exists(target)).to.eql(false);
        } else {
          const aggregate = aggregateOf(caught);
          expect(aggregate.message).to.eql(
            'Deploy staging manifest write failed and its resulting bytes could not be retained.',
          );
          expect(aggregate.cause).to.equal(failure);
          expect(aggregate.errors.length).to.eql(2);
          expect(aggregate.errors[0]).to.equal(failure);
          expect(messageOf(aggregate.errors[1])).to.eql(changed(target));
          expect(removed).to.eql([]);
          expect((await Fs.lstat(target))?.isSymlink).to.eql(true);
        }
      });
    });
  }

  for (const rootReplaced of [false, true]) {
    const rootState = rootReplaced ? 'replaced' : 'unchanged';
    const outcome = rootReplaced ? 'paired failure and preservation' : 'root retracted';
    it(`temporary cleanup failure, root ${rootState} → ${outcome}`, async () => {
      await withTmpDir(async (tmp) => {
        const root = `${tmp}/stage`;
        const child = `${root}/nested`;
        await Fs.write(`${child}/a.txt`, 'A', { throw: true });
        const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'test root' });
        const ledger = createStagingManifestLedger();
        const records: StagingManifestRecord[] = [];
        const failures: unknown[] = [];
        const replacements = new Map<string, string>();
        const caught = await failureOf(() =>
          finalizeDistTree({ dir: root, rootIdentity, manifestLedger: ledger }, {
            publish: publishStagingManifest,
            async remove(record) {
              records.push(record);
              if (record.dir === child || rootReplaced) {
                const dist = (await Fs.readJson(record.path)).data;
                if (!Pkg.Is.dist(dist)) throw new Error('Expected successful manifest production.');
                const replacement = Json.stringify({
                  ...dist,
                  pkg: { name: '@foreign/label', version: '2' },
                });
                replacements.set(record.path, replacement);
                await Fs.write(record.path, replacement, { throw: true });
                expect(Hash.sha256(replacement)).not.to.eql(record.manifestChecksum);
              }
              try {
                await removeStagingManifest(record);
              } catch (error) {
                failures.push(error);
                throw error;
              }
            },
          })
        );
        expect(records.map((record) => record.dir)).to.eql([child, root]);
        expect(ledger.get(child)).to.equal(records[0]);
        expect(ledger.get(root)).to.equal(rootReplaced ? records[1] : undefined);
        expect(ledger.size).to.eql(rootReplaced ? 2 : 1);
        expect(await Fs.exists(`${root}/dist.json`)).to.eql(rootReplaced);
        for (const [path, bytes] of replacements) {
          expect((await Fs.readText(path)).data).to.eql(bytes);
        }
        if (rootReplaced) {
          const aggregate = aggregateOf(caught);
          expect(aggregate.message).to.eql(
            'Deploy staging temporary-manifest cleanup failed and root-manifest retraction also failed.',
          );
          expect(aggregate.cause).to.equal(failures[0]);
          expect(aggregate.errors.length).to.eql(2);
          expect(aggregate.errors[0]).to.equal(failures[0]);
          expect(aggregate.errors[1]).to.equal(failures[1]);
          expect(aggregate.errors.map(messageOf)).to.eql([
            changed(`${child}/dist.json`),
            changed(`${root}/dist.json`),
          ]);
        } else {
          expect(caught).to.equal(failures[0]);
          expect(failures.length).to.eql(1);
          expect(messageOf(caught)).to.eql(changed(`${child}/dist.json`));
        }
      });
    });
  }
});

async function stagingManifestBytesChecksum(path: string): Promise<string> {
  const read = await Fs.read(path);
  if (!read.ok || !read.data) throw new Error('Expected manifest bytes.');
  return Hash.sha256(read.data);
}

/** A successful return is never evidence of a refused operation. */
async function failureOf(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (error) {
    return error;
  }
  throw new Error('Expected operation refusal.');
}

function aggregateOf(error: unknown): AggregateError {
  expect(error).to.be.instanceOf(AggregateError);
  return error as AggregateError;
}

const messageOf = (error: unknown) => Is.error(error) ? error.message : error;
const changed = (path: string) => `Deploy staging owned manifest changed before cleanup: ${path}`;
