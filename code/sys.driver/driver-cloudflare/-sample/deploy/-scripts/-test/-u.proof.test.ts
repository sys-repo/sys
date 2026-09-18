import { R2 } from '@sys/driver-cloudflare/r2';
import { WebFixture } from '@sys/testing/web';
import { prepareProof, prove } from '../u.proof.ts';
import { DIST_LIMITS, LIMITS } from '../../src/m.app/u.selection.ts';
import { describe, expect, expectError, Fs, it, Json, Pkg, type t } from './common.ts';

describe('R2 deployment sample: proof selection', () => {
  it('new build → new pin and derived files, without changing the previous run', async () => {
    await using f = await fixture();
    const first = await prepareProof(f.dir.absolute);
    const rebuilt = await f.build('second', true);
    const second = await prepareProof(f.dir.absolute);
    expect(first.inputs.config).to.eql(f.config);
    expect(first.inputs.pin).to.eql(f.pin);
    expect(second.inputs.pin).to.eql(rebuilt);
    expect(second.inputs.pin).not.to.eql(first.inputs.pin);
    expect(first.expected.size).to.eql(2);
    expect(second.expected.size).to.eql(3);
    expect(new TextDecoder().decode(first.expected.get('index.html'))).to.eql('first');
    expect(new TextDecoder().decode(second.expected.get('index.html'))).to.eql('second');
    const firstCheck = await first.verify();
    expect(firstCheck.kind).to.eql('integrity-mismatch');
    const secondCheck = await second.verify();
    expect(secondCheck.kind).to.eql('verified');
  });

  it('later pin/config edits → rechecks retain the captured inputs and bytes', async () => {
    await using f = await fixture();
    const selected = await prepareProof(f.dir.absolute);
    const laterPin = { 'dist.json': `sha256-${'0'.repeat(64)}` };
    const laterConfig = { ...f.config, prefix: 'later/ui' };
    await Fs.writeJson(f.dir.join('dist.pin.json'), laterPin, { throw: true });
    await Fs.writeJson(f.dir.join('r2.config.json'), laterConfig, { throw: true });

    const rechecked = await selected.verify();
    expect(rechecked.kind).to.eql('verified');
    expect(selected.inputs).to.eql({ config: f.config, pin: f.pin });
    expect(selected.files).to.eql(['dist.json', 'index.html']);
    expect(Object.isFrozen(selected.inputs.config.credentials)).to.eql(true);
    expect(Object.isFrozen(selected.inputs.pin)).to.eql(true);
  });

  it('rebuilt Dist with the old pin → refusal, not automatic repinning', async () => {
    await using f = await fixture();
    await f.build('second');
    await Fs.writeJson(f.dir.join('dist.pin.json'), f.pin, { throw: true });
    await expectError(
      () => prepareProof(f.dir.absolute),
      'Local Dist refused: integrity-mismatch.',
    );
  });

  it('changed asset bytes → refusal before live work', async () => {
    await using f = await fixture();
    await Fs.write(f.dir.join('dist/index.html'), 'changed', { throw: true });
    await expectError(() => prepareProof(f.dir.absolute), 'Local Dist refused: content-mismatch.');
  });

  it('persisted inventory fields → pin refusal', async () => {
    await using f = await fixture();
    const invalidPin = { ...f.pin, files: ['index.html'] };
    await Fs.writeJson(f.dir.join('dist.pin.json'), invalidPin, { throw: true });
    await expectError(() => prepareProof(f.dir.absolute), 'Invalid sample Dist pin.');
  });
});

describe('R2 deployment sample: bootstrap-inclusive delivery proof', () => {
  it('complete proof → observed application/storage counts match the announced ceilings', async () => {
    await using f = await deliveryFixture();
    await prove(f.options);
    const count = f.storage.size;
    expect(f.events[0]).to.include({ maxRequests: 2 * count + 6, maxStorageReads: 2 * count + 2 });
    expect(f.state.requests).to.eql(2 * count + 6);
    expect(f.storageKeys.length).to.eql(2 * count + 2);
    expect(f.storageKeys.filter((path) => path === 'dist.json').length).to.eql(3);
    expect(f.events.at(-1)).to.include({ result: 'verified', bootstrapAttempts: 1 });
    expect(f.state.starts).to.eql(1);
    expect(f.state.closes).to.eql(1);
  });

  it('negative-probe filenames in the build → no extra storage read', async () => {
    await using f = await deliveryFixture([
      'unselected-proof-file.txt',
      '_unselected-proof-file.txt',
    ]);
    await prove(f.options);
    expect(f.state.requests).to.eql(2 * f.storage.size + 6);
    expect(f.storageKeys.length).to.eql(2 * f.storage.size + 2);
    expect(f.events.at(-1)).to.include({ result: 'verified' });
  });

  it('metadata replaced after announcement → entry and receipt retain the original authority', async () => {
    await using f = await deliveryFixture();
    const log = f.options.log;
    await prove({
      ...f.options,
      log(message) {
        log?.(message);
        if (Json.parse<{ result?: string }>(message)?.result !== 'selected') return;
        expect(f.storageKeys).to.eql([]); // Announcement precedes even bootstrap acquisition.
        Deno.writeTextFileSync(
          f.dir.join('r2.config.json'),
          Json.stringify({ ...f.config, prefix: 'other/ui' }),
        );
        Deno.writeTextFileSync(
          f.dir.join('dist.pin.json'),
          Json.stringify({ 'dist.json': `sha256-${'0'.repeat(64)}` }),
        );
      },
    });
    expect(f.events.at(-1)).to.include({ result: 'verified', integrity: f.pin['dist.json'] });
    expect(f.events.at(-1)?.target).to.eql({
      accountId: f.config.accountId,
      bucket: f.config.bucket,
      prefix: f.config.prefix,
    });
    expect(f.state.requests).to.eql(2 * f.storage.size + 6);
    expect(f.storageKeys.length).to.eql(2 * f.storage.size + 2);
  });

  it('bootstrap mismatch → one read, no listener/API requests, and no retry', async () => {
    await using f = await deliveryFixture();
    f.storage.set('dist.json', new TextEncoder().encode('{}'));
    await expectError(() => prove(f.options), 'integrity-mismatch');
    expect(f.storageKeys).to.eql(['dist.json']);
    expect(f.state).to.eql({ starts: 0, closes: 0, requests: 0 });
    expect(f.events.at(-1)).to.include({ result: 'refused', requests: 0, bootstrapAttempts: 1 });
  });

  it('changed remote asset → admission succeeds, delivery stops at the first mismatch', async () => {
    await using f = await deliveryFixture();
    f.storage.set('index.html', new TextEncoder().encode('other'));
    await expectError(() => prove(f.options), 'GET index.html refused');
    expect(f.storageKeys).to.eql(['dist.json', 'dist.json', 'dist.json', 'index.html']);
    expect(f.state).to.eql({ starts: 1, closes: 1, requests: 3 });
    expect(f.events.at(-1)).to.include({ result: 'refused', requests: 3, bootstrapAttempts: 1 });
  });
});

async function fixture(files: readonly string[] = []) {
  const temp = await Fs.makeTempDir({ prefix: 'sample-r2-proof-' });
  try {
    const dir = Fs.toDir(await Fs.realPath(temp.absolute));
    const config = {
      accountId: '1'.repeat(32),
      bucket: 'fixture-bucket',
      prefix: 'fixture/ui',
      credentials: {
        accessKeyId: 'PROOF_FIXTURE_ACCESS_KEY_ID',
        secretAccessKey: 'PROOF_FIXTURE_SECRET_ACCESS_KEY',
      },
      limits: LIMITS,
    };
    await Fs.writeJson(dir.join('r2.config.json'), config, { throw: true });
    const build = async (html: string, extra = false) => {
      await Fs.write(dir.join('dist/index.html'), html, { throw: true });
      if (extra) await Fs.write(dir.join('dist/app.js'), 'export {};', { throw: true });
      await Pkg.Dist.compute({
        dir: dir.join('dist'),
        pkg: { name: '@test/r2', version: '0.0.0' },
        save: true,
      });
      const verified = await Pkg.Dist.Local.verify({ dir: dir.join('dist'), limits: DIST_LIMITS });
      if (verified.kind !== 'verified') throw new Error(`Fixture Dist refused: ${verified.kind}.`);
      const pin = { 'dist.json': verified.evidence.integrity };
      await Fs.writeJson(dir.join('dist.pin.json'), pin, { throw: true });
      return pin;
    };
    for (const path of files) await Fs.write(dir.join('dist', path), 'fixture', { throw: true });
    const pin = await build('first');
    return {
      dir,
      config,
      pin,
      build,
      async [Symbol.asyncDispose]() {
        await Fs.remove(dir.absolute);
      },
    };
  } catch (error) {
    await Fs.remove(temp.absolute);
    throw error;
  }
}

/** Real entry, signer, app, and Fetch client; only transport and listener ownership are fixtures. */
async function deliveryFixture(files: readonly string[] = []) {
  const f = await fixture(files);
  try {
    const selected = await prepareProof(f.dir.absolute);
    const storage = new Map(selected.expected);
    const storageKeys: string[] = [];
    const events: Record<string, unknown>[] = [];
    const state = { starts: 0, closes: 0, requests: 0 };
    let app: t.HttpServer.App | undefined;
    const origin = R2.Service.storageUrl(f.config.accountId);
    const prefix = `/${f.config.bucket}/${f.config.prefix}/`;
    const mock = WebFixture.Fetch.mock(async (input, init) => {
      const req = new Request(input, init);
      const url = new URL(req.url);
      if (url.origin === origin && url.pathname.startsWith(prefix)) {
        const path = url.pathname.slice(prefix.length);
        storageKeys.push(path);
        const bytes = storage.get(path);
        return bytes ? new Response(new Uint8Array(bytes)) : new Response(null, { status: 404 });
      }
      if (url.origin !== 'http://127.0.0.1:8080' || !app) {
        throw new Error('Unexpected fixture request.');
      }
      state.requests++;
      return await app.fetch(req);
    });
    const options: t.ProofOptions = {
      root: f.dir.absolute,
      env: { get: () => 'fixture-only-credential' },
      log(text) {
        const event = Json.parse<Record<string, unknown>>(text);
        if (!event) throw new Error('Expected proof event.');
        events.push(event);
      },
      start(value) {
        app = value;
        state.starts++;
        return {
          finished: Promise.resolve(),
          close: () => {
            state.closes++;
            return Promise.resolve();
          },
        };
      },
    };
    return {
      ...f,
      options,
      storage,
      storageKeys,
      events,
      state,
      async [Symbol.asyncDispose]() {
        mock.dispose();
        await f[Symbol.asyncDispose]();
      },
    };
  } catch (error) {
    await f[Symbol.asyncDispose]();
    throw error;
  }
}
