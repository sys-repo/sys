import { Fs } from '@sys/fs';
import { guardFailure } from '../u/u.guard.ts';
import { describe, expect, it } from './common.ts';
import { compoundCleanup } from './u.fixture.extract.cleanup.ts';
import { cancelDuringCleanup, ownerFailure } from './u.fixture.extract.failure.ts';
import { rootedFailure, withArchive, withRooted } from './u.fixture.extract.ts';
import { context, failureText, rejection } from './u.fixture.ts';
import { extractTool } from './u.fixture.tools.ts';

describe('Pi: ZIP extraction / failure evidence', () => {
  describe('owner-selected primary', () => {
    for (const boundary of ['stage', 'lease', 'promotion'] as const) {
      it(`${boundary} failure → primary and internal cleanup classifications remain separate`, async () => {
        await withArchive(async (root) => {
          const fault = await ownerFailure(root, boundary);
          const tool = await extractTool(root, { rooted: fault.rooted });
          const message = await failureText(() =>
            tool.execute(
              'owner-fault',
              { path: 'a.zip', to: 'unpacked' },
              undefined,
              undefined,
              context(root),
            )
          );
          const primaryAt = message.indexOf('primary=');
          expect(primaryAt).to.be.greaterThan(0);
          expect(message.slice(0, primaryAt)).to.include('io-failure');
          expect(message.slice(primaryAt)).to.include('unsupported');
          expect(message).to.include(
            boundary === 'promotion' ? 'cleanup=failed' : 'cleanup=unconfirmed',
          );
          expect(message).to.include('publication=not published');
          expect(message.length).to.be.at.most(16_000);
          expect(await Fs.exists(fault.destination)).to.eql(false);
          expect(fault.held).to.eql(false);
        });
      });
    }

    it('cancellation during Fs cleanup → cannot replace selected promotion failure', async () => {
      await withArchive(async (root) => {
        const fault = await cancelDuringCleanup(root);
        const tool = await extractTool(root, { rooted: fault.rooted, queue: fault.queue });
        const message = await failureText(() =>
          tool.execute(
            'late-cancel-failure',
            { path: 'a.zip', to: 'unpacked' },
            fault.signal,
            undefined,
            context(root),
          )
        );
        expect(fault.failure?.kind).to.eql('unsupported');
        expect(fault.failure?.committed).to.eql(false);
        expect(fault.failure?.cleanupError).to.eql(undefined);
        expect(fault.events).to.eql([
          'rename-refused',
          'cleanup-removed',
          'cancelled',
          'owner-rejected',
          'unlocked',
          'closed',
          'queue-released',
        ]);
        expect(message).to.include('primary=filesystem promote-stage unsupported');
        expect(message).to.include('interruption=operation cancelled');
        expect(message).to.include('publication=not published');
        expect(message).to.include('cleanup=complete for acquired resources');
        expect(message).not.to.include('SECRET:');
        expect(message.length).to.be.at.most(16_000);
        expect(await Fs.exists(fault.destination)).to.eql(false);
      });
    });
  });

  describe('compound cleanup', () => {
    for (
      const [boundary, operation] of [
        ['release', 'release-lease'],
        ['discard', 'discard-stage'],
        ['promotion', 'promote-stage'],
      ] as const
    ) {
      describe(operation, () => {
        for (const primaryKind of ['unsupported', 'io-failure'] as const) {
          it(`${primaryKind} + io-failure → retains both roles, publication, and settlement`, async () => {
            await withArchive(async (root) => {
              const fault = await compoundCleanup(root, boundary, primaryKind);
              const tool = await extractTool(root, { rooted: fault.rooted, queue: fault.queue });
              const message = await failureText(() =>
                tool.execute(
                  'compound-cleanup',
                  { path: 'a.zip', to: 'unpacked' },
                  fault.signal,
                  undefined,
                  context(root),
                )
              );
              expect(fault.events).to.eql(
                boundary === 'release'
                  ? ['primary', 'unlocked', 'secondary', 'lock-closed', 'queue-released']
                  : [
                    'primary',
                    'marker-closed',
                    'secondary',
                    'unlocked',
                    'lock-closed',
                    'queue-released',
                  ],
              );
              expect(message).to.include(`cleanup=failed (filesystem ${operation} ${primaryKind}`);
              expect(message).to.include(`secondary=filesystem ${operation} io-failure`);
              expect(message.split(`filesystem ${operation} io-failure`).length).to.eql(
                primaryKind === 'io-failure' ? 3 : 2,
              );
              expect(message).to.include(
                `publication=${boundary === 'discard' ? 'not published' : 'published'}`,
              );
              expect(message).not.to.include('SECRET:');
              expect(message.length).to.be.at.most(16_000);
              expect(await Fs.exists(fault.destination)).to.eql(boundary !== 'discard');
              expect(fault.stagePath).not.to.eql('');
              expect(fault.removalsAfterFailure).to.eql(0);
              expect(await Fs.exists(Fs.dirname(fault.stagePath))).to.eql(boundary !== 'release');
              if (fault.published) {
                expect((await Fs.readText(Fs.join(fault.destination, 'deep/a.txt'))).data).to.eql(
                  'hello',
                );
              }
            });
          });
        }
      });
    }
  });

  describe('residue and incomplete acquisition', () => {
    it('caller-seam discard fault → preserves primary refusal, non-publication and residue truth', async () => {
      await withArchive(async (root) => {
        const failure = await rootedFailure(root);
        let stagePath = '';
        const rooted = withRooted((actual) => ({
          ...actual,
          Stage: {
            ...actual.Stage,
            promote() {
              throw guardFailure('forced promotion refusal');
            },
            discard(stage) {
              stagePath = stage.path;
              throw failure;
            },
          },
        }));
        const tool = await extractTool(root, { rooted });
        const message = await failureText(() =>
          tool.execute(
            'discard',
            { path: 'a.zip', to: 'unpacked' },
            undefined,
            undefined,
            context(root),
          )
        );
        expect(message).to.include('forced promotion refusal');
        expect(message).to.include('publication=not published');
        expect(message).to.include('cleanup=failed');
        expect(message).to.include('private-stage-reference=');
        expect(await Fs.exists(Fs.join(root, 'unpacked'))).to.eql(false);
        expect(await Fs.exists(stagePath)).to.eql(true);
      });
    });

    it('stage creation cleanup failure → no returned handle does not imply complete cleanup', async () => {
      await withArchive(async (root) => {
        let stagePath = '';
        const rooted = withRooted((actual) => ({
          ...actual,
          Stage: {
            ...actual.Stage,
            async create(options) {
              const stage = await actual.Stage.create(options);
              stagePath = stage.path;
              await Fs.rename(stage.path, Fs.join(root, 'stranded-stage'));
              await Fs.write(Fs.join(stage.path, 'foreign'), 'not ours', { throw: true });
              // Authenticated cleanup failure before any handle returns.
              await actual.Stage.discard(stage);
              throw new Error('Expected Rooted to refuse foreign cleanup.');
            },
          },
        }));
        const tool = await extractTool(root, { rooted });
        await rejection(
          () =>
            tool.execute(
              'create',
              { path: 'a.zip', to: 'unpacked' },
              undefined,
              undefined,
              context(root),
            ),
          'cleanup=unconfirmed',
        );
        expect(await Fs.exists(Fs.join(root, 'unpacked'))).to.eql(false);
        expect((await Fs.readText(Fs.join(stagePath, 'foreign'))).data).to.eql('not ours');
      });
    });
  });
});
