import { R2 } from '@sys/driver-cloudflare/r2';
import { WebFixture } from '@sys/testing/web';
import { Fetch } from '@sys/http/client';
import { prepareProof, prove, proveWith } from '../task.proof.local.ts';
import { describe, expect, expectError, Fs, it, Json, Obj, Str, type t, Time } from './common.ts';
import { localFixture as fixture } from './u.fixture.ts';

describe('R2 deployment sample: proof selection', () => {
  it('new build → new selection without broadening the private proof inventory', async () => {
    await using f = await fixture();
    const first = await prepareProof(f.dir.absolute);
    const rebuilt = await f.build('second', { 'extra.svg': '<svg />' });
    const second = await prepareProof(f.dir.absolute);
    expect(first.inputs.config).to.eql(f.config);
    expect(first.inputs.buildRecord).to.eql(f.buildRecord);
    expect(second.inputs.buildRecord).to.eql(rebuilt);
    expect(second.inputs.buildRecord).not.to.eql(first.inputs.buildRecord);
    expect([...first.expected.keys()]).to.eql(['dist.json', 'index.html']);
    expect([...second.expected.keys()]).to.eql(['dist.json', 'index.html']);
    expect(new TextDecoder().decode(first.expected.get('index.html'))).to.eql('first');
    expect(new TextDecoder().decode(second.expected.get('index.html'))).to.eql('second');
    expect((await first.verify()).kind).to.eql('integrity-mismatch');
    expect((await second.verify()).kind).to.eql('verified');
  });

  it('later selection/config edits → rechecks retain captured inputs and bytes', async () => {
    await using f = await fixture();
    const selected = await prepareProof(f.dir.absolute);
    await Fs.writeJson(f.dir.join('dist.pins.json'), {}, { throw: true });
    await Fs.writeJson(f.dir.join('r2.config.json'), {}, { throw: true });
    expect((await selected.verify()).kind).to.eql('verified');
    expect(selected.inputs).to.eql({ config: f.config, buildRecord: f.buildRecord });
    expect(selected.files).to.eql(['dist.json', 'index.html']);
  });

  it('changed private bytes → refusal before live work', async () => {
    await using f = await fixture();
    await Fs.write(f.dir.join('dist.private/index.html'), 'changed', { throw: true });
    await expectError(() => prepareProof(f.dir.absolute), 'Local Dist refused: content-mismatch.');
  });
});

describe('R2 deployment sample: bootstrap-inclusive private delivery proof', () => {
  it('complete proof → observed counts match the private-only ceilings and receipt', async () => {
    await using f = await deliveryFixture();
    await prove(f.options);
    // Two private files: GET/HEAD each, index/API/redirect/refusal probes, plus bootstrap.
    expect(f.events[0]).to.include({
      scope: 'private-shell',
      maxRequests: 10,
      maxStorageReads: 6,
    });
    expect(f.state.requests).to.eql(10);
    expect(f.storageKeys.length).to.eql(6);
    expect(f.storageKeys.filter((path) => path === 'dist.json').length).to.eql(3);
    expect(f.events.at(-1)).to.include({
      result: 'verified',
      scope: 'private-shell',
      publicDelivery: 'not exercised',
      bootstrapAttempts: 1,
    });
    expect(f.state.starts).to.eql(1);
    expect(f.state.closes).to.eql(1);
  });

  it('absent public and original output → private proof remains explicitly private', async () => {
    await using f = await deliveryFixture();
    await Fs.remove(f.dir.join('dist.public'));
    await Fs.remove(f.dir.join('dist'));
    await prove(f.options);
    expect(f.state.requests).to.eql(10);
    expect(f.storageKeys.length).to.eql(6);
    expect(f.events.at(-1)).to.include({ result: 'verified', publicDelivery: 'not exercised' });
  });

  it('awaited announcement mutates callbacks → original starter and reader method remain authoritative', async () => {
    await using f = await deliveryFixture();
    const announced = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const reader = f.options.env;
    const get = reader.get;
    let originalReads = 0;
    reader.get = function (name) {
      expect(this).to.equal(reader);
      originalReads++;
      return get(name);
    };
    const options = {
      ...f.options,
      async log(text: string) {
        f.options.log(text);
        if (f.events.at(-1)?.result !== 'selected') return;
        await Fs.writeJson(f.dir.join('r2.config.json'), {}, { throw: true });
        await Fs.writeJson(f.dir.join('dist.pins.json'), {}, { throw: true });
        options.start = () => {
          throw new Error('Replaced starter invoked.');
        };
        options.env = {
          get: () => {
            throw new Error('Replaced reader invoked.');
          },
        };
        reader.get = () => {
          throw new Error('Replaced method invoked.');
        };
        announced.resolve();
        await release.promise;
      },
    };
    const pending = Promise.allSettled([prove(options)]);
    try {
      await announced.promise;
      expect(originalReads).to.eql(0);
      expect(f.storageKeys).to.eql([]);
      expect(f.state.starts).to.eql(0);
      release.resolve();
      expect(await pending).to.eql([{ status: 'fulfilled', value: undefined }]);
      expect(originalReads).to.eql(2);
      expect(f.state).to.eql({ starts: 1, closes: 1, requests: 10 });
      expect(f.events.at(-1)?.integrity).to.eql(f.buildRecord.selection.pins.private['dist.json']);
    } finally {
      release.resolve();
      await pending;
    }
  });

  it('reader absent at entry → later logger injection cannot replace deferred environment loading', async () => {
    await using f = await deliveryFixture();
    const names = f.config.credentials.serve;
    const dotenv = Str.dedent(`
      ${names.accessKeyId}=fixture
      ${names.secretAccessKey}=fixture
    `);
    await Fs.write(f.dir.join('.env'), dotenv, { throw: true });
    const options: t.ProofOptions = { ...f.options, env: undefined };
    const mutable = options as t.DeepMutable<t.ProofOptions>;
    mutable.log = (text) => {
      f.options.log(text);
      mutable.env = {
        get: () => {
          throw new Error('Late reader selected.');
        },
      };
    };
    await prove(options);
    expect(f.credentialNames).to.eql([]);
    expect(f.state.closes).to.eql(1);
  });

  it('HEAD transport failure → qualified Fetch status, one refusal, and cleanup', async () => {
    await using f = await deliveryFixture();
    f.refuseHead();
    const error = await expectError(() => prove(f.options));
    expect(error.message).to.eql('HEAD dist.json failed: Fetch status 520.');
    expect(f.events.filter((event) => event.result === 'refused')).to.have.length(1);
    expect(f.state).to.eql({ starts: 1, closes: 1, requests: 2 });
  });

  it('bootstrap mismatch → one read, no listener/API requests, and no retry', async () => {
    await using f = await deliveryFixture();
    f.storage.set('dist.json', new TextEncoder().encode('{}'));
    await expectError(() => prove(f.options), 'integrity-mismatch');
    expect(f.storageKeys).to.eql(['dist.json']);
    expect(f.state).to.eql({ starts: 0, closes: 0, requests: 0 });
    expect(f.events.at(-1)).to.include({ result: 'refused', requests: 0, bootstrapAttempts: 1 });
  });

  it('changed remote shell → admission succeeds, delivery stops at the first mismatch', async () => {
    await using f = await deliveryFixture();
    f.storage.set('index.html', new TextEncoder().encode('other'));
    await expectError(() => prove(f.options), 'GET index.html refused');
    expect(f.storageKeys).to.eql(['dist.json', 'dist.json', 'dist.json', 'index.html']);
    expect(f.state).to.eql({ starts: 1, closes: 1, requests: 3 });
    expect(f.events.at(-1)).to.include({ result: 'refused', requests: 3, bootstrapAttempts: 1 });
  });
});

describe('R2 deployment sample: proof reporting', () => {
  it('async reports → ordered completion, including the final receipt before cleanup', async () => {
    await using f = await deliveryFixture();
    let reporting = false;
    await prove({
      ...f.options,
      async log(text) {
        expect(reporting).to.eql(false);
        reporting = true;
        await Time.wait(0);
        expect(f.state.closes).to.eql(0);
        f.options.log?.(text);
        reporting = false;
      },
    });
    expect(reporting).to.eql(false);
    const phases = f.events.map((event) => event.result ?? event.path);
    expect(phases).to.eql(['selected', 'dist.json', 'index.html', 'verified']);
    expect(f.state.closes).to.eql(1);
  });

  const phases = [
    { phase: 'selected', events: ['selected'], requests: 0, reads: 0, starts: 0 },
    { phase: 'dist.json', events: ['selected', 'dist.json'], requests: 2, reads: 3, starts: 1 },
    {
      phase: 'verified',
      events: ['selected', 'dist.json', 'index.html', 'verified'],
      requests: 10,
      reads: 6,
      starts: 1,
    },
  ];
  for (const item of phases) {
    it(`${item.phase} report rejects → original error, no reporter retry, and listener cleanup`, async () => {
      await using f = await deliveryFixture();
      const failure = new Error('fixture reporting failure');
      const log = (text: string) => {
        f.options.log?.(text);
        const event = f.events.at(-1);
        if ((event?.result ?? event?.path) === item.phase) return Promise.reject(failure);
      };
      const error = await expectError(() => prove({ ...f.options, log }));
      expect(error).to.equal(failure);
      expect(f.events.map((event) => event.result ?? event.path)).to.eql(item.events);
      expect(f.storageKeys.length).to.eql(item.reads);
      expect(f.state).to.eql({ starts: item.starts, closes: item.starts, requests: item.requests });
      if (item.phase === 'selected') expect(f.credentialNames).to.eql([]);
    });
  }

  it('delivery and refusal-report failures → both causes survive, with cleanup and no retry', async () => {
    await using f = await deliveryFixture();
    f.storage.set('index.html', new TextEncoder().encode('other'));
    const failure = new Error('fixture refusal-report failure');
    const log = (text: string) => {
      f.options.log?.(text);
      if (f.events.at(-1)?.result === 'refused') return Promise.reject(failure);
    };
    const error = await expectError(() => prove({ ...f.options, log }));
    expect(error).to.be.instanceOf(SuppressedError);
    const suppressed = error as SuppressedError;
    expect(suppressed.error).to.equal(failure);
    expect(suppressed.suppressed.message).to.include('GET index.html refused');
    expect(f.events.at(-1)).to.include({ result: 'refused', path: 'index.html', requests: 3 });
    expect(f.events.filter((event) => event.result === 'refused')).to.have.length(1);
    expect(f.state).to.eql({ starts: 1, closes: 1, requests: 3 });
  });
});

describe('R2 deployment sample: proof cleanup', () => {
  it('delivery, reporting, and disposal failures → client-before-server suppression without flattening', async () => {
    await using f = await deliveryFixture();
    f.storage.set('index.html', new TextEncoder().encode('other'));
    const reporting = new Error('report failed');
    const clientFailure = new Error('client cleanup failed');
    const serverFailure = new AggregateError([new Error('shutdown'), new Error('completion')]);
    const cleanup: string[] = [];
    const error = await expectError(() =>
      proveWith((args) => {
        const client = Fetch.make(args);
        return {
          ...client,
          [Symbol.dispose]() {
            client.dispose();
            cleanup.push('client');
            throw clientFailure;
          },
        };
      }, {
        ...f.options,
        log(text) {
          f.options.log(text);
          if (f.events.at(-1)?.result === 'refused') throw reporting;
        },
        start(app) {
          const server = f.options.start(app);
          return {
            async [Symbol.asyncDispose]() {
              await server[Symbol.asyncDispose]();
              cleanup.push('server');
              throw serverFailure;
            },
          };
        },
      })
    );
    expect(error).to.be.instanceOf(SuppressedError);
    const outer = error as SuppressedError;
    const client = outer.suppressed as SuppressedError;
    const report = client.suppressed as SuppressedError;
    expect(outer.error).to.equal(serverFailure);
    expect(client.error).to.equal(clientFailure);
    expect(report.error).to.equal(reporting);
    expect(report.suppressed.message).to.include('GET index.html refused');
    expect(cleanup).to.eql(['client', 'server']);
    expect(f.events.filter((event) => event.result === 'refused')).to.have.length(1);
  });

  it('client acquisition throws → report once and dispose the acquired server', async () => {
    await using f = await deliveryFixture();
    const failure = new Error('client construction failed');
    const error = await expectError(() =>
      proveWith(() => {
        throw failure;
      }, f.options)
    );
    expect(error).to.equal(failure);
    expect(f.state).to.eql({ starts: 1, closes: 1, requests: 0 });
    expect(f.events.map((event) => event.result)).to.eql(['selected', 'refused']);
  });

  it('successful proof then server disposal rejects → preserve the owner error without a refusal report', async () => {
    await using f = await deliveryFixture();
    const failure = new Error('server cleanup failed');
    const error = await expectError(() =>
      prove({
        ...f.options,
        start(app) {
          const server = f.options.start(app);
          return {
            async [Symbol.asyncDispose]() {
              await server[Symbol.asyncDispose]();
              throw failure;
            },
          };
        },
      })
    );
    expect(error).to.equal(failure);
    expect(f.state.closes).to.eql(1);
    expect(f.events.at(-1)?.result).to.eql('verified');
    expect(f.events.some((event) => event.result === 'refused')).to.eql(false);
  });
});

/** Exercise the real app, signer, and client with an in-memory server and storage transport. */
async function deliveryFixture() {
  const f = await fixture();
  try {
    const selected = await prepareProof(f.dir.absolute);
    const storage = new Map(selected.expected);
    const storageKeys: string[] = [];
    const events: Record<string, unknown>[] = [];
    const credentialNames: string[] = [];
    const state = { starts: 0, closes: 0, requests: 0 };
    let app: t.HttpServer.App | undefined;
    let refuseHead = false;
    const origin = R2.Service.storageUrl(f.config.accountId);
    const target = f.config.targets.private;
    const prefix = `/${target.bucket}/${target.prefix}/`;
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
      if (refuseHead && req.method === 'HEAD') throw new Error('Fixture HEAD transport refusal.');
      return await app.fetch(req);
    });
    const options = {
      root: f.dir.absolute,
      env: {
        get(name) {
          credentialNames.push(name);
          if (!Obj.entries(f.config.credentials.serve).some(([, value]) => value === name)) {
            throw new Error('Private proof requested publishing credentials.');
          }
          return 'fixture-only-credential';
        },
      },
      log(text) {
        const event = Json.parse<Record<string, unknown>>(text);
        if (!event) throw new Error('Expected proof event.');
        return events.push(event); // A synchronous logger may return an incidental value.
      },
      start(value) {
        app = value;
        state.starts++;
        const completion = Promise.withResolvers<void>();
        return {
          finished: completion.promise,
          [Symbol.asyncDispose]() {
            state.closes++;
            app = undefined;
            completion.resolve();
            return completion.promise;
          },
        };
      },
    } satisfies t.ProofOptions;
    return {
      ...f,
      options,
      storage,
      storageKeys,
      events,
      credentialNames,
      state,
      refuseHead() {
        refuseHead = true;
      },
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
