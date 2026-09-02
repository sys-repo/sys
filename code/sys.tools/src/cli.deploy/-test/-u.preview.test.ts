import { DistServer } from '@sys/server/dist/server';
import { describe, expect, expectError, Fs, it, Testing } from '../../-test.ts';
import type { t } from '../common.ts';
import {
  DEPLOY_PREVIEW_PORT,
  deployPreviewChoices,
  runDeployPreviewSessionWith,
  verifyDeployPreview,
} from '../u.preview.ts';
import { DEPLOY_DIST_VERIFY_LIMITS } from '../u.staging/u.verifyStagedDist.ts';
import {
  createPendingPreviewPromptStarted,
  createPreviewPromptStarted,
  createPreviewStarted,
  withPreviewDist,
} from './u.preview.fixture.ts';

describe('Deploy: verified preview', () => {
  it('derives fresh endpoint status and invalidates changed, undeclared, and malformed roots', async () => {
    await withPreviewDist(async ({ root }) => {
      const initial = await verifyDeployPreview(root);
      expect(initial.kind).to.eql('verified');
      if (initial.kind !== 'verified') return;
      expect(Object.isFrozen(initial)).to.eql(true);
      expect(Object.isFrozen(initial.evidence)).to.eql(true);

      const cancelled = new AbortController();
      cancelled.abort('test.cancel');
      expect(await verifyDeployPreview(root, cancelled.signal)).to.eql({
        kind: 'unavailable',
        reason: 'cancelled',
      });

      await Fs.write(`${root}/assets/app.js`, 'export const changed = true;\n');
      expect(await verifyDeployPreview(root)).to.eql({
        kind: 'unavailable',
        reason: 'content-mismatch',
      });

      await Fs.write(`${root}/assets/app.js`, 'export const ready = true;\n');
      expect((await verifyDeployPreview(root)).kind).to.eql('verified');

      await Fs.write(`${root}/undeclared.txt`, 'undeclared\n');
      expect(await verifyDeployPreview(root)).to.eql({
        kind: 'unavailable',
        reason: 'unexpected-entry',
      });
      await Fs.remove(`${root}/undeclared.txt`);

      await Fs.write(`${root}/dist.json`, '{ malformed');
      expect(await verifyDeployPreview(root)).to.eql({ kind: 'unavailable', reason: 'malformed' });
    });
  });

  it('refuses changed, undeclared, and malformed roots before listener or prompt authority', async () => {
    await withPreviewDist(async ({ cwd, root }) => {
      const port = Testing.randomPort();
      let prompts = 0;
      const run = () =>
        runDeployPreviewSessionWith(
          { cwd, dir: root, name: 'sample', port },
          {
            start: DistServer.Local.start,
            prompt: () => {
              prompts += 1;
              return createPreviewPromptStarted({ kind: 'back' });
            },
            open: () => undefined,
          },
        );

      await Fs.write(`${root}/assets/app.js`, 'export const changed = true;\n');
      expect(await run()).to.eql({ ok: false, reason: 'content-mismatch' });
      assertLoopbackPortAvailable(port);

      await Fs.write(`${root}/assets/app.js`, 'export const ready = true;\n');
      await Fs.write(`${root}/undeclared.txt`, 'undeclared\n');
      expect(await run()).to.eql({ ok: false, reason: 'unexpected-entry' });
      assertLoopbackPortAvailable(port);

      await Fs.remove(`${root}/undeclared.txt`);
      await Fs.write(`${root}/dist.json`, '{ malformed');
      expect(await run()).to.eql({ ok: false, reason: 'malformed' });
      assertLoopbackPortAvailable(port);
      expect(prompts).to.eql(0);
    });
  });

  it('serves only verified root and exact nested indexes and derives encoded choices from startup evidence', async () => {
    await withPreviewDist(async ({ cwd, root }) => {
      const port = Testing.randomPort();
      let choices: readonly string[] = [];
      const result = await runDeployPreviewSessionWith(
        { cwd, dir: root, name: 'fixture', port },
        {
          start: DistServer.Local.start,
          open: () => undefined,
          prompt(input) {
            return createPreviewPromptStarted((async () => {
              choices = input.choices.map((choice) => choice.path);
              expect(new URL(input.origin).port).to.eql(String(port));

              const rootResponse = await fetch(`${input.origin}/`);
              expect(rootResponse.status).to.eql(200);
              expect(await rootResponse.text()).to.eql('<h1>root</h1>\n');

              const nested = await fetch(`${input.origin}/guides%20%26%20refs/index.html`);
              expect(nested.status).to.eql(200);
              expect(await nested.text()).to.eql('<h1>nested</h1>\n');

              const asset = await fetch(`${input.origin}/assets/app.js`);
              expect(asset.status).to.eql(200);
              expect(await asset.text()).to.eql('export const ready = true;\n');

              const manifest = await fetch(`${input.origin}/dist.json`);
              expect(manifest.status).to.eql(200);
              expect((await manifest.text()).length).to.be.greaterThan(0);

              const directory = await fetch(`${input.origin}/guides%20%26%20refs/`);
              expect(directory.status).to.eql(404);
              await directory.body?.cancel();
              const unknown = await fetch(`${input.origin}/unknown`);
              expect(unknown.status).to.eql(404);
              await unknown.body?.cancel();
              return { kind: 'back' };
            })());
          },
        },
      );

      expect(result).to.eql({ ok: true });
      assertLoopbackPortAvailable(port);
      expect(choices).to.eql(['/', '/guides%20%26%20refs/index.html']);
    });
  });

  it('uses numeric loopback, the exact requested port, silent startup, and disabled keyboard input', async () => {
    await withPreviewDist(async ({ cwd, root, evidence }) => {
      const starts: t.DeployPreview.StartInput[] = [];
      const closes: string[] = [];
      const dependencies: t.DeployPreview.Dependencies = {
        start(args) {
          starts.push(args);
          return Promise.resolve(
            createPreviewStarted(evidence, 'http://127.0.0.1:4040', (reason) => {
              closes.push(String(reason));
            }),
          );
        },
        prompt: () => createPreviewPromptStarted({ kind: 'back' }),
        open: () => undefined,
      };

      const result = await runDeployPreviewSessionWith(
        { cwd, dir: root, name: 'fixture' },
        dependencies,
      );

      expect(result).to.eql({ ok: true });
      expect(starts.length).to.eql(1);
      expect(starts[0]).to.contain({
        dir: root,
        hostname: '127.0.0.1',
        port: DEPLOY_PREVIEW_PORT,
        name: 'fixture',
        silent: true,
        keyboard: false,
      });
      expect(starts[0]?.limits).to.equal(DEPLOY_DIST_VERIFY_LIMITS);
      expect(closes).to.eql(['deploy.preview.close']);
    });
  });

  it('keeps fixture close authority pending through lower close and listener completion', async () => {
    await withPreviewDist(async ({ evidence }) => {
      const closeEntered = Promise.withResolvers<void>();
      const releaseClose = Promise.withResolvers<void>();
      const listenerFinished = Promise.withResolvers<void>();
      const started = createPreviewStarted(
        evidence,
        'http://127.0.0.1:4040',
        () => {
          closeEntered.resolve();
          return releaseClose.promise;
        },
        { finished: listenerFinished.promise },
      );

      const closing = started.close('test.close');
      await closeEntered.promise;
      let settled = false;
      void closing.then(() => settled = true);
      await Promise.resolve();
      expect(settled).to.eql(false);
      expect(started.signal.aborted).to.eql(true);

      releaseClose.resolve();
      await Promise.resolve();
      expect(settled).to.eql(false);
      listenerFinished.resolve();
      await closing;
      expect(settled).to.eql(true);
    });
  });

  it('opens, reloads with fresh choices, and unwinds each started lifecycle exactly once', async () => {
    await withPreviewDist(async ({ cwd, root, evidence }) => {
      const rootIndex = rootIndexOf(evidence);
      const reloadedEvidence = structuredClone({
        ...evidence,
        dist: {
          ...evidence.dist,
          hash: { ...evidence.dist.hash, parts: { 'index.html': rootIndex } },
        },
      });
      const events: string[] = [];
      const reloadCloseEntered = Promise.withResolvers<void>();
      const releaseReloadClose = Promise.withResolvers<void>();
      let generation = 0;
      let prompts = 0;
      const dependencies: t.DeployPreview.Dependencies = {
        start() {
          generation += 1;
          const current = generation;
          events.push(`start:${current}`);
          return Promise.resolve(
            createPreviewStarted(
              current === 1 ? evidence : reloadedEvidence,
              `http://127.0.0.1:404${current}`,
              (reason) => {
                events.push(`close:${current}:${String(reason)}`);
                if (current !== 1) return;
                reloadCloseEntered.resolve();
                return releaseReloadClose.promise;
              },
            ),
          );
        },
        prompt(input) {
          prompts += 1;
          events.push(`prompt:${generation}`);
          expect(input.choices.map((choice) => choice.path)).to.eql(
            generation === 1 ? ['/', '/guides%20%26%20refs/index.html'] : ['/'],
          );
          if (prompts === 1) return createPreviewPromptStarted(input.choices[0]!);
          if (prompts === 2) return createPreviewPromptStarted({ kind: 'reload' });
          return createPreviewPromptStarted({ kind: 'back' });
        },
        open(_cwd, url) {
          events.push(`open:${url}`);
        },
      };

      const pending = runDeployPreviewSessionWith(
        { cwd, dir: root, name: 'fixture' },
        dependencies,
      );
      await reloadCloseEntered.promise;
      expect(generation).to.eql(1);
      releaseReloadClose.resolve();
      const result = await pending;

      expect(result).to.eql({ ok: true });
      expect(events.join('\n')).to.eql([
        'start:1',
        'prompt:1',
        'open:http://127.0.0.1:4041/',
        'prompt:1',
        'close:1:deploy.preview.reload',
        'start:2',
        'prompt:2',
        'close:2:deploy.preview.close',
      ].join('\n'));
    });
  });

  it('settles cancellation and thrown presentation paths with one close', async () => {
    await withPreviewDist(async ({ cwd, root, evidence }) => {
      const alreadyCancelled = new AbortController();
      alreadyCancelled.abort('test.cancel.before-start');
      let cancelledStarts = 0;
      const cancelledBeforeStart = await runDeployPreviewSessionWith(
        { cwd, dir: root, name: 'sample', until: alreadyCancelled.signal },
        {
          start: () => {
            cancelledStarts += 1;
            return Promise.resolve(
              createPreviewStarted(evidence, 'http://127.0.0.1:4040', () => undefined),
            );
          },
          prompt: () => createPreviewPromptStarted({ kind: 'back' }),
          open: () => undefined,
        },
      );
      expect(cancelledBeforeStart).to.eql({ ok: false, reason: 'cancelled' });
      expect(cancelledStarts).to.eql(0);

      const controller = new AbortController();
      const cancellationEvents: string[] = [];
      const promptEntered = Promise.withResolvers<void>();
      const promptDisposeEntered = Promise.withResolvers<void>();
      const releasePromptDispose = Promise.withResolvers<void>();
      const pending = runDeployPreviewSessionWith(
        { cwd, dir: root, name: 'fixture', until: controller.signal },
        {
          start: () =>
            Promise.resolve(
              createPreviewStarted(evidence, 'http://127.0.0.1:4040', (reason) => {
                cancellationEvents.push(`close:${String(reason)}`);
              }),
            ),
          prompt: () => {
            promptEntered.resolve();
            return createPendingPreviewPromptStarted(async (reason) => {
              cancellationEvents.push(`prompt-dispose:${String(reason)}`);
              promptDisposeEntered.resolve();
              await releasePromptDispose.promise;
            });
          },
          open: () => undefined,
        },
      );

      await promptEntered.promise;
      controller.abort('test.cancel');
      await promptDisposeEntered.promise;
      let cancellationSettled = false;
      void pending.then(() => cancellationSettled = true);
      await Promise.resolve();
      expect(cancellationSettled).to.eql(false);
      expect(cancellationEvents).to.eql(['prompt-dispose:deploy.preview.prompt.stop']);

      releasePromptDispose.resolve();
      expect(await pending).to.eql({ ok: false, reason: 'cancelled' });
      expect(cancellationEvents).to.eql([
        'prompt-dispose:deploy.preview.prompt.stop',
        'close:deploy.preview.close',
      ]);

      const concurrentAbort = new AbortController();
      const concurrentOpens: string[] = [];
      const concurrentCloses: unknown[] = [];
      const abortedOpen = await runDeployPreviewSessionWith(
        { cwd, dir: root, name: 'fixture', until: concurrentAbort.signal },
        {
          start: () =>
            Promise.resolve(
              createPreviewStarted(evidence, 'http://127.0.0.1:4040', (reason) => {
                concurrentCloses.push(reason);
              }),
            ),
          prompt(input) {
            const owner = createPreviewPromptStarted(input.choices[0]!);
            queueMicrotask(() => concurrentAbort.abort('test.concurrent-open'));
            return owner;
          },
          open: (_cwd, url) => void concurrentOpens.push(url),
        },
      );
      expect(abortedOpen).to.eql({ ok: false, reason: 'cancelled' });
      expect(concurrentOpens).to.eql([]);
      expect(concurrentCloses).to.eql(['deploy.preview.close']);

      const thrownCloses: unknown[] = [];
      const thrown = runDeployPreviewSessionWith(
        { cwd, dir: root, name: 'fixture' },
        {
          start: () =>
            Promise.resolve(
              createPreviewStarted(evidence, 'http://127.0.0.1:4040', (reason) => {
                thrownCloses.push(reason);
              }),
            ),
          prompt: (input) => createPreviewPromptStarted(input.choices[0]!),
          open: () => {
            throw new Error('open failed');
          },
        },
      );
      await expectError(() => thrown, 'open failed');
      expect(thrownCloses).to.eql(['deploy.preview.close']);

      const promptCloses: unknown[] = [];
      const promptThrown = runDeployPreviewSessionWith(
        { cwd, dir: root, name: 'fixture' },
        {
          start: () =>
            Promise.resolve(
              createPreviewStarted(evidence, 'http://127.0.0.1:4040', (reason) => {
                promptCloses.push(reason);
              }),
            ),
          prompt: () => {
            throw new Error('prompt disposed');
          },
          open: () => undefined,
        },
      );
      await expectError(() => promptThrown, 'prompt disposed');
      expect(promptCloses).to.eql(['deploy.preview.close']);
    });
  });

  it('keeps primary session outcomes authoritative across rejected close cleanup', async () => {
    await withPreviewDist(async ({ cwd, root, evidence }) => {
      let backCloses = 0;
      const back = await runDeployPreviewSessionWith(
        { cwd, dir: root, name: 'fixture' },
        {
          start: () =>
            Promise.resolve(
              createPreviewStarted(evidence, 'http://127.0.0.1:4040', () => {
                backCloses += 1;
                throw new Error('lower close failed');
              }),
            ),
          prompt: () => createPreviewPromptStarted({ kind: 'back' }),
          open: () => undefined,
        },
      );
      expect(back).to.eql({ ok: false, reason: 'startup-failure' });
      expect(backCloses).to.eql(1);

      let reloadStarts = 0;
      let reloadCloses = 0;
      const reload = await runDeployPreviewSessionWith(
        { cwd, dir: root, name: 'fixture' },
        {
          start: () => {
            reloadStarts += 1;
            return Promise.resolve(
              createPreviewStarted(evidence, 'http://127.0.0.1:4040', () => {
                reloadCloses += 1;
                throw new Error('lower close failed');
              }),
            );
          },
          prompt: () => createPreviewPromptStarted({ kind: 'reload' }),
          open: () => undefined,
        },
      );
      expect(reload).to.eql({ ok: false, reason: 'startup-failure' });
      expect(reloadStarts).to.eql(1);
      expect(reloadCloses).to.eql(1);

      const cancellation = new AbortController();
      const promptEntered = Promise.withResolvers<void>();
      let cancellationCloses = 0;
      const cancelling = runDeployPreviewSessionWith(
        { cwd, dir: root, name: 'fixture', until: cancellation.signal },
        {
          start: () =>
            Promise.resolve(
              createPreviewStarted(evidence, 'http://127.0.0.1:4040', () => {
                cancellationCloses += 1;
                throw new Error('lower close failed');
              }),
            ),
          prompt: () => {
            promptEntered.resolve();
            return createPendingPreviewPromptStarted();
          },
          open: () => undefined,
        },
      );
      await promptEntered.promise;
      cancellation.abort('test.cancel');
      expect(await cancelling).to.eql({ ok: false, reason: 'cancelled' });
      expect(cancellationCloses).to.eql(1);

      let presentationCloses = 0;
      const presentation = runDeployPreviewSessionWith(
        { cwd, dir: root, name: 'fixture' },
        {
          start: () =>
            Promise.resolve(
              createPreviewStarted(evidence, 'http://127.0.0.1:4040', () => {
                presentationCloses += 1;
                throw new Error('lower close failed');
              }),
            ),
          prompt: (input) => createPreviewPromptStarted(input.choices[0]!),
          open: () => {
            throw new Error('presentation failed');
          },
        },
      );
      await expectError(() => presentation, 'presentation failed');
      expect(presentationCloses).to.eql(1);
    });
  });

  it('owns pending prompts across listener signal and finished settlement', async () => {
    await withPreviewDist(async ({ cwd, root, evidence }) => {
      for (const mode of ['signal', 'finished', 'finished-rejection'] as const) {
        const listenerController = new AbortController();
        const listenerFinished = Promise.withResolvers<void>();
        const promptEntered = Promise.withResolvers<void>();
        const events: string[] = [];
        const opens: string[] = [];

        const pending = runDeployPreviewSessionWith(
          { cwd, dir: root, name: 'fixture' },
          {
            start: () =>
              Promise.resolve(
                createPreviewStarted(
                  evidence,
                  'http://127.0.0.1:4040',
                  (reason) => {
                    events.push(`close:${String(reason)}`);
                    if (mode === 'signal') listenerFinished.resolve();
                  },
                  { controller: listenerController, finished: listenerFinished.promise },
                ),
              ),
            prompt: () => {
              promptEntered.resolve();
              return createPendingPreviewPromptStarted((reason) => {
                events.push(`prompt-dispose:${String(reason)}`);
              });
            },
            open: (_cwd, url) => void opens.push(url),
          },
        );

        await promptEntered.promise;
        if (mode === 'signal') listenerController.abort('test.listener.abort');
        if (mode === 'finished') listenerFinished.resolve();
        if (mode === 'finished-rejection') {
          listenerFinished.reject(new Error('lower listener failed'));
        }

        expect(await pending).to.eql({ ok: false, reason: 'startup-failure' });
        expect(opens).to.eql([]);
        expect(events).to.eql([
          'prompt-dispose:deploy.preview.prompt.stop',
          'close:deploy.preview.close',
        ]);
      }
    });
  });

  it('refuses an occupied requested port without prompting or fallback rebinding', async () => {
    await withPreviewDist(async ({ cwd, root }) => {
      const port = Testing.randomPort();
      const occupied = await DistServer.Local.start({
        dir: root,
        limits: DEPLOY_DIST_VERIFY_LIMITS,
        hostname: '127.0.0.1',
        port,
        silent: true,
        keyboard: false,
      });
      let prompts = 0;
      try {
        const result = await runDeployPreviewSessionWith(
          { cwd, dir: root, name: 'fixture', port },
          {
            start: DistServer.Local.start,
            prompt: () => {
              prompts += 1;
              return createPreviewPromptStarted({ kind: 'back' });
            },
            open: () => undefined,
          },
        );
        expect(result).to.eql({ ok: false, reason: 'address-in-use' });
        expect(prompts).to.eql(0);
      } finally {
        await occupied.close('test.cleanup');
      }
    });
  });

  it('orders root and nested choices naturally with deterministic code-unit ties', async () => {
    await withPreviewDist(({ evidence }) => {
      const index = rootIndexOf(evidence);
      const changed = structuredClone({
        ...evidence,
        dist: {
          ...evidence.dist,
          hash: {
            ...evidence.dist.hash,
            parts: {
              'docs10/index.html': index,
              'docs2/index.html': index,
              'index.html': index,
            },
          },
        },
      });
      const choices = deployPreviewChoices({
        origin: 'http://127.0.0.1:4040',
        verification: changed,
      });
      expect(choices.map((choice) => choice.path)).to.eql([
        '/',
        '/docs2/index.html',
        '/docs10/index.html',
      ]);
      expect(Object.isFrozen(choices)).to.eql(true);
      expect(choices.every(Object.isFrozen)).to.eql(true);
    });
  });
});

/** Helpers: */
function rootIndexOf(evidence: t.Pkg.Dist.Local.Verify.Evidence): t.StringUri {
  const part = evidence.dist.hash.parts['index.html'];
  if (!part) throw new Error('Expected preview fixture root index evidence.');
  return part;
}

function assertLoopbackPortAvailable(port: number): void {
  const listener = Deno.listen({ hostname: '127.0.0.1', port });
  listener.close();
}
