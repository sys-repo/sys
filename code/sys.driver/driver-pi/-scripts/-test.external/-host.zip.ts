import { lstat, realPath } from '@sys/fs/observe';
import { Path } from '@sys/std/path';
import { Raw } from '../../src/m.cli/m.raw/mod.ts';
import { resolveRun } from '../../src/m.cli/m.profiles/u/u.resolve.run.ts';
import { withInherit } from '../../src/m.cli/u/u.inherit.ts';
import { PI_AGENT_IMPORT } from '../../src/m.cli/u/u.resolve.pkg.ts';
import { Fixture as ArchiveFixture } from '../../../../sys/archive/src/m.Zip/-test/u.fixture.ts';
import { describe, Err, expect, Fs, Is, it, Json, Obj, Process, Str, type t } from '../common.ts';

const PREFIX = 'SYS_ZIP_HOST_QUEUE ';
const packageRoot = Fs.resolve(import.meta.dirname ?? '.', '../..');

type AliasFixture = { target: string; alias: string };

/** The baseline does not substitute for alias or extraction acceptance. */
describe('Pi: ZIP host baseline', () => {
  it('selected CLI → shared loader binding, queue exclusion, and failure recovery', () =>
    runHost());
});

/** Use the workspace install's existing public package link; never create or mutate an alias. */
describe('Pi: ZIP host alias', () => {
  it('installed package symlink → shared canonical queue key', async () => {
    const root = Fs.resolve(packageRoot, '../../../node_modules');
    const alias = Fs.join(root, '@earendil-works/pi-coding-agent');
    const link = await lstat(alias);
    if (!link?.isSymlink) {
      throw Err.std(`Missing workspace installation symlink fixture: ${alias}`);
    }
    const target = await realPath(alias);
    if (target === alias || !Path.Is.within(await realPath(root), target)) {
      throw Err.std(
        'Host alias fixture must resolve to a distinct path inside the workspace install.',
      );
    }
    const directory = await lstat(target);
    expect(directory?.isDirectory).to.eql(true);
    expect(directory?.isSymlink).to.eql(false);
    await runHost({ target, alias });
  });
});

describe('Pi: ZIP host extraction', () => {
  it('generated entry → queued cancellation and real Agent sequencing/failure results', () =>
    runHost(undefined, true));
});

/** Resolve real policy and execute the selected CLI with one explicitly supplied test extension. */
async function runHost(alias?: AliasFixture, extraction = false) {
  const tmp = Fs.join(packageRoot, '.tmp');
  await Fs.ensureDir(tmp);
  let childUnsettled = false;
  await using fixture = {
    root: (await Fs.makeTempDir({ dir: tmp, prefix: 'zip-host.' })).absolute,
    async [Symbol.asyncDispose]() {
      if (childUnsettled) {
        throw Err.std(`Host settlement unconfirmed; fixture retained at ${this.root}`);
      }
      // The installation alias is read-only input; only this invocation's private tree is owned.
      await Fs.remove(this.root);
    },
  };
  const { root } = fixture;
  const captures: t.Process.CaptureOutput[] = [];
  const config = Fs.join(root, 'profile.yaml');
  const extension = Fs.join(root, 'host-fixture.ts');
  await Fs.write(
    config,
    Json.stringify({
      prompt: { system: 'Local host-integration fixture. No provider requests.' },
      tools: {
        zip: extraction ? { enabled: true, extract: 'cooperative' } : { enabled: false },
        ocr: { pdf: { enabled: false } },
      },
      sandbox: {
        capability: {
          read: ['./', ...(alias ? [alias.alias, alias.target] : [])],
          write: ['./'],
        },
      },
    }),
    { throw: true },
  );
  await Fs.write(extension, hostFixture(alias, extraction), { throw: true });
  if (extraction) {
    await Fs.write(Fs.join(root, 'extract-fixture.ts'), extractionFixture(), { throw: true });
    await Fs.write(
      Fs.join(root, 'a.zip'),
      ArchiveFixture.zip([{ name: 'a.txt', data: 'hello', method: 8 }]).bytes,
      { throw: true },
    );
    await Fs.write(
      Fs.join(root, 'bad.zip'),
      ArchiveFixture.zip([{ name: 'a.txt', data: 'bad', crc32: 0 }]).bytes,
      { throw: true },
    );
  }
  await Fs.write(
    Fs.join(root, 'binding-fixture.ts'),
    Str.dedent(`
        import { withFileMutationQueue } from '@earendil-works/pi-coding-agent';
        export default function (pi) {
          pi.events.emit('zip:queue-binding', withFileMutationQueue);
        }
      `),
    { throw: true },
  );
  await Fs.write(Fs.join(root, 'existing'), 'fixture', { throw: true });

  const resolved = await resolveRun({
    cwd: { invoked: root, root },
    config,
    args: ['--mode', 'rpc', '--no-session'],
    env: { TMPDIR: tmp, TMP: tmp, TEMP: tmp },
  });
  expect(resolved.pkg).to.eql(PI_AGENT_IMPORT);
  await withInherit(async (input) => {
    // Use the actual owner-produced launch vector; reject drift that forwards ambient credentials.
    expect(Obj.keys(input.env ?? {}).sort()).to.eql([
      'DENO_DIR',
      'HOME',
      'PI_CODING_AGENT_DIR',
      'PI_SKIP_VERSION_CHECK',
      'TEMP',
      'TMP',
      'TMPDIR',
    ]);
    for (const key of ['DENO_DIR', 'HOME', 'PI_CODING_AGENT_DIR']) {
      expect(Path.Is.within(root, input.env?.[key]), `${key} must be fixture-owned`).to.eql(true);
    }
    childUnsettled = true;
    const output = await Process.capture({
      ...input,
      clearEnv: true,
      executionTimeout: 120_000,
      maxStdoutBytes: 65_536,
      maxStderrBytes: 262_144,
    });
    captures.push(output);
    childUnsettled = output.outcome !== 'failed-to-start' && output.status === null;
    if (output.outcome !== 'exited') {
      throw Err.std(`Host did not settle normally: ${output.outcome}\n${output.text.stderr}`);
    }
    return { code: output.code, success: output.success, signal: output.signal };
  }, () => Raw.run({ ...resolved, args: [...resolved.args, '--extension', extension] }));

  expect(captures.length).to.eql(1);
  const output = captures[0];
  expect(output.outcome).to.eql('exited');
  expect(output.success, output.text.stderr).to.eql(true);
  expect(output.stdoutTruncated).to.eql(false);
  expect(output.stderrTruncated).to.eql(false);
  const lines = output.text.stdout.split('\n').filter((line) => line.startsWith(PREFIX));
  expect(lines.length, `${output.text.stdout}\n${output.text.stderr}`).to.eql(1);
  const evidence: unknown = Json.parse(lines[0].slice(PREFIX.length));
  if (!Is.record(evidence)) throw Err.std('Missing host queue evidence.');
  expect(evidence.bound).to.eql(true);
  expect(evidence.existing).to.eql(['held', 'other', 'release', 'same']);
  expect(evidence.missing).to.eql(['held', 'other', 'release', 'same']);
  if (alias) expect(evidence.alias).to.eql(['held', 'other', 'release', 'same']);
  expect(evidence.registrationRejected).to.eql(true);
  expect(evidence.invalidCallbackRan).to.eql(false);
  expect(evidence.callbackRejected).to.eql(true);
  expect(evidence.recovered).to.eql(true);
  if (extraction) {
    if (!Is.record(evidence.extracted)) throw Err.std('Missing extraction host evidence.');
    expect(evidence.extracted.queuedCancellation).to.eql(true);
    expect(evidence.extracted.events).to.eql([
      'start:publish',
      'end:publish',
      'start:sibling',
      'end:sibling',
      'start:corrupt',
      'end:corrupt',
    ]);
    expect(evidence.extracted.results).to.eql([
      { id: 'publish', isError: false },
      { id: 'sibling', isError: false },
      { id: 'corrupt', isError: true },
    ]);
    expect(evidence.extracted.eventResults).to.eql(evidence.extracted.results);
    expect(evidence.extracted.publication).to.eql({ kind: 'published', cleanup: 'complete' });
    expect(evidence.extracted.published).to.eql(true);
    expect(evidence.extracted.corruptRefused).to.eql(true);
    expect(evidence.extracted.providerCalls).to.eql(2);
  }
}

/** Scripted observations run inside the selected CLI, never inside a replacement host. */
function hostFixture(alias?: AliasFixture, extraction = false) {
  return Str.dedent(`
    ${extraction ? "import { prepareExtraction } from './extract-fixture.ts';" : ''}
    import { join } from 'node:path';
    import {
      createEventBus, discoverAndLoadExtensions, withFileMutationQueue,
    } from '@earendil-works/pi-coding-agent';

    export default function (pi) {
      const extract = ${extraction ? 'prepareExtraction(pi)' : 'undefined'};
      pi.on('session_start', async (_event, ctx) => {
        const root = ctx.cwd;
        const bus = createEventBus();
        let observed;
        const unsubscribe = bus.on('zip:queue-binding', (value) => { observed = value; });
        try {
          const loaded = await discoverAndLoadExtensions(
            [join(root, 'binding-fixture.ts')], root, join(root, 'agent'), bus,
          );
          const bound = loaded.errors.length === 0 && loaded.extensions.length === 1 &&
            observed === withFileMutationQueue;

          const existing = await exclusion(
            join(root, 'existing'), join(root, 'existing'), join(root, 'existing.other'),
          );
          const missing = await exclusion(
            join(root, 'missing'), join(root, 'missing'), join(root, 'missing.other'),
          );
          const suppliedAlias = ${Json.stringify(alias ?? null)};
          const alias = suppliedAlias
            ? await exclusion(suppliedAlias.target, suppliedAlias.alias, join(root, 'alias.other'))
            : null;
          let registrationRejected = false;
          let invalidCallbackRan = false;
          try {
            await withFileMutationQueue(null, () => { invalidCallbackRan = true; });
          } catch {
            registrationRejected = true;
          }
          const failure = new Error('fixture callback rejection');
          let callbackRejected = false;
          try {
            await withFileMutationQueue(join(root, 'existing'), () => { throw failure; });
          } catch (error) {
            callbackRejected = error === failure;
          }
          const recovered = await withFileMutationQueue(join(root, 'existing'), () => true);
          const extracted = extract ? await extract(ctx) : undefined;
          console.log(${Json.stringify(PREFIX)} + JSON.stringify({
            bound, existing, missing, alias, registrationRejected, invalidCallbackRan,
            callbackRejected, recovered, extracted,
          }));
        } finally {
          unsubscribe();
          ctx.shutdown();
        }
      });
    }

    async function exclusion(path, alias, other) {
      const entered = Promise.withResolvers();
      const release = Promise.withResolvers();
      const events = [];
      const held = withFileMutationQueue(path, async () => {
        events.push('held');
        entered.resolve();
        await release.promise;
      });
      let same = Promise.resolve();
      try {
        const started = await Promise.race([
          entered.promise.then(() => true), held.then(() => false),
        ]);
        if (!started) throw new Error('Host queue settled without entering its callback.');
        same = withFileMutationQueue(alias, () => { events.push('same'); });
        // Later different-key entry observes the earlier registration, not an arbitrary sleep.
        await withFileMutationQueue(other, () => { events.push('other'); });
        events.push('release');
      } finally {
        release.resolve();
        const settled = await Promise.allSettled([held, same]);
        for (const result of settled) {
          if (result.status === 'rejected') throw result.reason;
        }
      }
      return events;
    }
  `);
}

/** Public provider and tool APIs exercise the actual Agent loop without a remote provider request. */
function extractionFixture() {
  return Str.dedent(`
    import { join } from 'node:path';
    import { createAssistantMessageEventStream } from '@earendil-works/pi-ai';
    import { createEventBus, discoverAndLoadExtensions, withFileMutationQueue } from '@earendil-works/pi-coding-agent';

    export function prepareExtraction(pi) {
      const events = [];
      const eventResults = [];
      let publication;
      const completed = Promise.withResolvers();
      let providerCalls = 0;
      let results = [];
      pi.registerProvider('zip-local-fixture', {
        api: 'zip-local-fixture', baseUrl: 'https://invalid.invalid',
        // Synthetic local fixture value, never an inherited credential or a remote request.
        apiKey: 'local-fixture-only', authHeader: false,
        models: [{ id: 'zip-fixture', name: 'ZIP local fixture', reasoning: false, input: ['text'],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 1024 }],
        streamSimple(model, context) {
          providerCalls++;
          if (providerCalls > 2) throw new Error('Unexpected fixture provider continuation.');
          const calls = [
            { type: 'toolCall', id: 'publish', name: 'zip_extract', arguments: { path: 'a.zip', to: 'unpacked' } },
            { type: 'toolCall', id: 'sibling', name: 'zip_host_sibling', arguments: {} },
            { type: 'toolCall', id: 'corrupt', name: 'zip_extract', arguments: { path: './'.repeat(2000) + 'bad.zip', to: 'bad-out' } },
          ];
          if (providerCalls === 2) {
            results = context.messages.filter((message) => message.role === 'toolResult')
              .map((message) => ({ id: message.toolCallId, isError: message.isError }));
            const corrupt = context.messages.find((message) => message.role === 'toolResult' && message.toolCallId === 'corrupt');
            const text = corrupt?.content.filter((part) => part.type === 'text').map((part) => part.text).join('');
            if (!corrupt?.isError || !text?.includes('crc-mismatch') || text.length > 16000) {
              throw new Error('Agent did not preserve the bounded failure code for an admitted long source path.');
            }
          }
          const message = {
            role: 'assistant', api: model.api, provider: model.provider, model: model.id,
            content: providerCalls === 1 ? calls : [{ type: 'text', text: 'Local extraction fixture complete.' }],
            stopReason: providerCalls === 1 ? 'toolUse' : 'stop', timestamp: Date.now(),
            usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
          };
          const stream = createAssistantMessageEventStream();
          stream.push({ type: 'start', partial: message });
          stream.push({ type: 'done', reason: message.stopReason, message });
          return stream;
        },
      });
      pi.registerTool({
        name: 'zip_host_sibling', label: 'Local sibling', description: 'Local sequencing fixture.',
        parameters: { type: 'object', properties: {}, additionalProperties: false },
        executionMode: 'parallel',
        async execute(_id, _params, _signal, _update, ctx) {
          if (await Deno.readTextFile(join(ctx.cwd, 'unpacked/a.txt')) !== 'hello') {
            throw new Error('Sibling ran before complete ZIP publication.');
          }
          return { content: [{ type: 'text', text: 'Sibling observed complete publication.' }], details: {} };
        },
      });
      pi.on('tool_execution_start', (event) => { events.push('start:' + event.toolCallId); });
      pi.on('tool_execution_end', (event) => {
        events.push('end:' + event.toolCallId);
        eventResults.push({ id: event.toolCallId, isError: event.isError });
        if (event.toolCallId === 'publish') publication = {
          kind: event.result.details?.publication, cleanup: event.result.details?.cleanup,
        };
      });
      pi.on('agent_settled', () => { completed.resolve(); });

      return async (ctx) => {
        if (!pi.getActiveTools().includes('zip_extract')) throw new Error('Generated extraction tool is not active.');
        const loaded = await discoverAndLoadExtensions(
          [join(ctx.cwd, '.pi/@sys/extensions/zip/mod.extract.ts')], ctx.cwd, join(ctx.cwd, 'agent'), createEventBus(),
        );
        if (loaded.errors.length || loaded.extensions.length !== 1) throw new Error('Generated extraction entry failed public host loading.');
        const tool = loaded.extensions[0].tools.get('zip_extract')?.definition;
        if (!tool || tool.executionMode !== 'sequential') throw new Error('Generated extraction lost its sequential contract.');
        const queuedCancellation = await cancelledWaiter(tool, ctx);
        const model = ctx.modelRegistry.find('zip-local-fixture', 'zip-fixture');
        if (!model || !await pi.setModel(model)) throw new Error('Local fixture model was not selected.');
        const timeout = setTimeout(() => completed.reject(new Error('Local Agent fixture did not settle.')), 10000);
        try {
          pi.sendUserMessage('Run the local ZIP acceptance fixture.');
          await completed.promise;
        } finally { clearTimeout(timeout); }
        const published = await Deno.readTextFile(join(ctx.cwd, 'unpacked/a.txt')) === 'hello';
        const corruptRefused = !await exists(join(ctx.cwd, 'bad-out'));
        return { queuedCancellation, events, eventResults, results, publication, published, corruptRefused, providerCalls };
      };
    }

    async function cancelledWaiter(tool, ctx) {
      const entered = Promise.withResolvers();
      const release = Promise.withResolvers();
      const waiting = Promise.withResolvers();
      const controller = new AbortController();
      const key = join(ctx.cwd, 'cancelled-out');
      const held = withFileMutationQueue(key, async () => {
        entered.resolve();
        await release.promise;
      });
      let pending = Promise.resolve(false);
      try {
        const started = await Promise.race([entered.promise.then(() => true), held.then(() => false)]);
        if (!started) throw new Error('Host queue did not enter held callback.');
        pending = tool.execute('cancelled', { path: 'absent.zip', to: key }, controller.signal,
          (result) => { if (result.details.kind === 'zip-extraction-waiting') waiting.resolve(); }, ctx,
        ).then(() => false, (error) => String(error.message).includes('operation cancelled'));
        const queued = await Promise.race([waiting.promise.then(() => true), pending.then(() => false)]);
        if (!queued) throw new Error('Extraction settled before reporting its queue wait.');
        // The progress callback precedes registration synchronously. This later registration joins
        // the same global chain and confirms the extraction's exact-key waiter was admitted.
        await withFileMutationQueue(join(ctx.cwd, 'cancel-progress'), () => true);
        controller.abort();
      } finally {
        release.resolve();
        const settled = await Promise.allSettled([held, pending]);
        for (const result of settled) if (result.status === 'rejected') throw result.reason;
      }
      if (!await pending || await exists(key) || await exists(join(ctx.cwd, '.sys.rooted'))) {
        throw new Error('Cancelled generated extraction performed source work or mutation.');
      }
      return true;
    }

    async function exists(path) {
      try { await Deno.lstat(path); return true; }
      catch (error) { if (error instanceof Deno.errors.NotFound) return false; throw error; }
    }
  `);
}
