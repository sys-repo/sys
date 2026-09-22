import { R2 } from '@sys/driver-cloudflare/r2';
import { WebFixture } from '@sys/testing/web';
import { prepareProof, prove } from '../u.proof.ts';
import { Testing } from '@sys/testing/server';
import { describe, Err, expect, expectError, Fs, it, Json, Obj, type t, Time } from './common.ts';
import { localFixture as fixture } from './u.fixture.ts';

describe('R2 deployment sample: proof selection', () => {
  it('old-file-only input → rebuild guidance before credential or live-work callbacks', async () => {
    await using f = await fixture();
    await Fs.writeJson(f.dir.join('dist.selection.json'), f.buildRecord, { throw: true });
    await Fs.remove(f.dir.join('dist.pins.json'));
    const calls: string[] = [];
    await expectError(() =>
      prove({
        root: f.dir.absolute,
        env: {
          get(name) {
            calls.push(name);
            throw new Error('Unexpected credential read.');
          },
        },
        start() {
          calls.push('start');
          throw new Error('Unexpected listener start.');
        },
        log() {
          calls.push('log');
        },
      }), 'Missing sample build record. Run deno task build');
    expect(calls).to.eql([]);
  });

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

  it('rebuilt shell with the old selection → refusal, not automatic repinning', async () => {
    await using f = await fixture();
    await f.build('second');
    await Fs.writeJson(f.dir.join('dist.pins.json'), f.buildRecord, { throw: true });
    await expectError(
      () => prepareProof(f.dir.absolute),
      'Local Dist refused: integrity-mismatch.',
    );
  });

  it('changed private bytes → refusal before live work', async () => {
    await using f = await fixture();
    await Fs.write(f.dir.join('dist.private/index.html'), 'changed', { throw: true });
    await expectError(() => prepareProof(f.dir.absolute), 'Local Dist refused: content-mismatch.');
  });

  it('persisted inventory fields → selection refusal', async () => {
    await using f = await fixture();
    await Fs.writeJson(f.dir.join('dist.pins.json'), {
      ...f.buildRecord,
      selection: {
        pins: {
          ...f.buildRecord.selection.pins,
          private: { ...f.buildRecord.selection.pins.private, files: ['index.html'] },
        },
      },
    }, { throw: true });
    await expectError(() => prepareProof(f.dir.absolute), 'Invalid sample build record.');
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

  it('metadata replaced after announcement → no live work until reporting settles; capture survives', async () => {
    await using f = await deliveryFixture();
    const release = Promise.withResolvers<void>();
    let replaced = false;
    const options: t.ProofOptions = {
      ...f.options,
      async log(text) {
        f.options.log?.(text);
        if (Json.parse<{ result?: string }>(text)?.result !== 'selected') return;
        await Fs.writeJson(f.dir.join('r2.config.json'), {}, { throw: true });
        await Fs.writeJson(f.dir.join('dist.pins.json'), {}, { throw: true });
        replaced = true;
        await release.promise;
      },
    };
    const pending = Err.Try.run(() => prove(options));
    try {
      await Testing.retry(100, { silent: true, delay: 10 }, () => expect(replaced).to.eql(true));
      expect(f.credentialNames).to.eql([]);
      expect(f.storageKeys).to.eql([]);
      expect(f.state).to.eql({ starts: 0, closes: 0, requests: 0 });
      release.resolve();
      expect((await pending).result.ok).to.eql(true);
    } finally {
      release.resolve();
      await pending;
    }
    expect(f.events.at(-1)).to.include({
      result: 'verified',
      integrity: f.buildRecord.selection.pins.private['dist.json'],
    });
    expect(f.events.at(-1)?.target).to.eql({
      accountId: f.config.accountId,
      ...f.config.targets.private,
    });
    expect(f.state.requests).to.eql(10);
    expect(f.storageKeys.length).to.eql(6);
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
    expect(error).to.be.instanceOf(AggregateError);
    expect(error).to.have.property('errors').with.length(2);
    expect(error.cause).to.have.property('message').that.includes('GET index.html refused');
    expect(error).to.have.nested.property('errors[0]', error.cause);
    expect(error).to.have.nested.property('errors[1]', failure);
    expect(f.events.at(-1)).to.include({ result: 'refused', path: 'index.html', requests: 3 });
    expect(f.events.filter((event) => event.result === 'refused')).to.have.length(1);
    expect(f.state).to.eql({ starts: 1, closes: 1, requests: 3 });
  });
});

describe('R2 deployment sample: proof cleanup', () => {
  it('close rejects before completion settles → await completion without losing the primary error', async () => {
    await using f = await deliveryFixture();
    const reporting = new Error('fixture report failure');
    const closing = new Error('fixture close failure');
    const enteredClose = Promise.withResolvers<void>();
    const completion = Promise.withResolvers<void>();
    let settled = false;
    const pending = expectError(() =>
      prove({
        ...f.options,
        log(text) {
          f.options.log(text);
          if (f.events.at(-1)?.path === 'dist.json') return Promise.reject(reporting);
        },
        start(app) {
          const server = f.options.start(app);
          return {
            finished: completion.promise,
            async close() {
              await server.close();
              enteredClose.resolve();
              throw closing;
            },
          };
        },
      })
    ).then((error) => {
      settled = true;
      return error;
    });
    try {
      await enteredClose.promise;
      await Time.wait(0);
      expect(settled).to.eql(false);
      completion.resolve();
      const error = await pending;
      expect(error).to.be.instanceOf(AggregateError);
      expect(error.cause).to.equal(reporting);
      expect(error).to.have.nested.property('errors[0]', reporting);
      expect(error).to.have.nested.property('errors[1]', closing);
      expect(f.state.closes).to.eql(1);
    } finally {
      completion.resolve();
      await pending;
    }
  });

  for (const phase of ['dist.json', 'refused']) {
    it(`${phase} reporter and both shutdown outcomes reject → retain every failure, observe completion`, async () => {
      await using f = await deliveryFixture();
      if (phase === 'refused') f.storage.set('index.html', new TextEncoder().encode('other'));
      const reporting = new Error('fixture report failure');
      const closing = new Error('fixture close failure');
      const finishing = new Error('fixture completion failure');
      let observed = 0;
      const error = await expectError(() =>
        prove({
          ...f.options,
          log(text) {
            f.options.log(text);
            const event = f.events.at(-1);
            if ((event?.result ?? event?.path) === phase) return Promise.reject(reporting);
          },
          start(app) {
            const server = f.options.start(app);
            return {
              get finished() {
                observed++;
                return Promise.reject(finishing);
              },
              async close() {
                await server.close();
                throw closing;
              },
            };
          },
        })
      );
      expect(error).to.be.instanceOf(AggregateError);
      const failures = (error as AggregateError).errors;
      if (phase === 'refused') {
        expect(failures[0]).to.have.property('message').that.includes('GET index.html refused');
        expect(failures.slice(1)).to.eql([reporting, closing, finishing]);
      } else {
        expect(failures).to.eql([reporting, closing, finishing]);
      }
      expect(error.cause).to.equal(failures[0]);
      expect(failures.at(-3)).to.equal(reporting);
      expect(failures.at(-2)).to.equal(closing);
      expect(failures.at(-1)).to.equal(finishing);
      expect(observed).to.eql(1);
      expect(f.state.closes).to.eql(1);
      expect(f.events.filter((event) => (event.result ?? event.path) === phase)).to.have.length(1);
      expect(f.events.at(-1)?.result ?? f.events.at(-1)?.path).to.eql(phase);
    });
  }

  for (const phase of ['close', 'finished']) {
    it(`successful proof then ${phase} rejection → original cleanup error, completion observed`, async () => {
      await using f = await deliveryFixture();
      const failure = new Error(`fixture ${phase} failure`);
      let observed = 0;
      const error = await expectError(() =>
        prove({
          ...f.options,
          start(app) {
            const server = f.options.start(app);
            return {
              get finished() {
                observed++;
                return phase === 'finished' ? Promise.reject(failure) : server.finished;
              },
              async close() {
                await server.close();
                if (phase === 'close') throw failure;
              },
            };
          },
        })
      );
      expect(error).to.equal(failure);
      expect(observed).to.eql(1);
      expect(f.state.closes).to.eql(1);
      expect(f.events.at(-1)?.result).to.eql('verified');
      expect(f.events.some((event) => event.result === 'refused')).to.eql(false);
    });
  }
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
        return {
          finished: Promise.resolve(),
          close() {
            state.closes++;
            return Promise.resolve();
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
