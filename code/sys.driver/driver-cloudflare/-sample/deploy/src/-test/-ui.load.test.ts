import { Hash } from '@sys/crypto/hash';
import { describe, expect, Fs, it, Json, type t, Testing, Time, WebFixture } from '../-test.ts';
import { startFetches } from '../ui/u.load.ts';
import { localFixture } from '../../-scripts/-test/u.fixture.ts';

const ORIGIN = 'https://sample.test';
// A reported sentinel value: this fixture tests extraction, not verified build identity.
const digest = `sha256-${'a'.repeat(64)}`;
const dist: t.DistPkg = {
  type: 'https://jsr.io/@sample/r2',
  build: {
    time: 0,
    size: { total: 0, pkg: 0 },
    builder: '@sys/driver-vite',
    runtime: 'deno',
    hash: { policy: 'https://jsr.io/@sys/crypto' },
  },
  hash: { digest, parts: {} },
};

describe('R2 deployment sample: UI fetches', () => {
  it('same-origin JSON → API message and reported manifest digest', async () => {
    const bytes = new TextEncoder().encode(Json.stringify(dist));
    const result = await fetchPair(Response.json({ msg: 'message from API' }), new Response(bytes));
    expect(result.message).to.eql('message from API');
    expect(result.digest).to.eql(digest);
    expect(result.checksum).to.eql(Hash.sha256(bytes));
    expect(result.urls.sort()).to.eql([`${ORIGIN}/api/hello`, `${ORIGIN}/ui/dist.json`]);
  });

  it('served projection bytes → checksum matches the build-selected private manifest pin', async () => {
    await using f = await localFixture();
    const file = await Fs.readText(f.dir.join('dist.private/dist.json'));
    expect(file.ok).to.eql(true);
    const result = await fetchPair(Response.json({ msg: 'hello' }), new Response(file.data));
    expect(result.checksum).to.eql(f.selection.private['dist.json']);
    expect(result.digest).not.to.eql(result.checksum);
  });

  it('whitespace and UTF-8 BOM → hash exact response bytes, not parsed or reserialized JSON', async () => {
    for (const prefix of ['  \n', '\uFEFF']) {
      const bytes = new TextEncoder().encode(`${prefix}${Json.stringify(dist)}\n`);
      const result = await fetchPair(Response.json({ msg: 'hello' }), new Response(bytes));
      expect(result.digest).to.eql(digest);
      expect(result.checksum).to.eql(Hash.sha256(bytes));
      expect(result.checksum).not.to.eql(Hash.sha256(Json.stringify(dist)));
    }
  });

  it('API completes first → message updates while the manifest remains pending', async () => {
    await using f = controlledPair();
    await Testing.retry(100, { silent: true, delay: 10 }, () => expect(f.urls.length).to.eql(2));
    f.message.resolve(Response.json({ msg: 'hello' }));
    await Testing.retry(100, { silent: true, delay: 10 }, () => {
      expect(f.messages).to.eql(['hello']);
    });
    expect(f.digests).to.eql([]);

    f.manifest.resolve(Response.json(dist));
    await Testing.retry(100, { silent: true, delay: 10 }, () => expect(f.digests).to.eql([digest]));
    expect(f.messages).to.eql(['hello']);
  });

  it('manifest completes first → digest updates while the API remains pending', async () => {
    await using f = controlledPair();
    await Testing.retry(100, { silent: true, delay: 10 }, () => expect(f.urls.length).to.eql(2));
    f.manifest.resolve(Response.json(dist));
    await Testing.retry(100, { silent: true, delay: 10 }, () => expect(f.digests).to.eql([digest]));
    expect(f.messages).to.eql([]);

    f.message.resolve(Response.json({ msg: 'hello' }));
    await Testing.retry(100, { silent: true, delay: 10 }, () => {
      expect(f.messages).to.eql(['hello']);
    });
    expect(f.digests).to.eql([digest]);
  });

  it('message delivered → disposal suppresses a late manifest response', async () => {
    await using f = controlledPair();
    await Testing.retry(100, { silent: true, delay: 10 }, () => expect(f.urls.length).to.eql(2));
    f.message.resolve(Response.json({ msg: 'hello' }));
    await Testing.retry(100, { silent: true, delay: 10 }, () => {
      expect(f.messages).to.eql(['hello']);
    });
    f.stop();

    let cancelled = false;
    // Keep the late body open so its disposal is observable before checking the callbacks.
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(Json.stringify(dist)));
      },
      cancel() {
        cancelled = true;
      },
    });
    f.manifest.resolve(new Response(body));
    await Testing.retry(100, { silent: true, delay: 10 }, () => expect(cancelled).to.eql(true));
    await Time.wait(0);
    expect(f.messages).to.eql(['hello']);
    expect(f.digests).to.eql([]);
  });

  it('invalid or failed manifest → digest error without losing the API message', async () => {
    const responses = [
      new Response(null, { status: 404 }),
      new Response('{broken'),
      Response.json({ hash: { digest } }),
      Response.json({ ...dist, hash: { digest: 'not-a-hash', parts: {} } }),
      new Response(new Uint8Array([255, 255])),
      new Response(' '.repeat(65_537)),
    ];
    for (const response of responses) {
      const result = await fetchPair(Response.json({ msg: 'hello' }), response);
      expect(result.message).to.eql('hello');
      expect(result.digest).to.eql('Could not load the private manifest.');
      expect(result.checksum).to.eql('Could not load the private manifest.');
    }
  });

  it('invalid API reply → message error without losing the Dist digest', async () => {
    const result = await fetchPair(Response.json({ msg: 123 }), Response.json(dist));
    expect(result.message).to.eql('Could not load the message.');
    expect(result.digest).to.eql(digest);
  });

  it('disposal → both requests abort without updating the view', async () => {
    const signals: AbortSignal[] = [];
    const updates: string[] = [];
    using _mock = WebFixture.Fetch.mock((input, init) => {
      const { signal } = new Request(input, init);
      signals.push(signal);
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    });
    const stop = startFetches(
      ORIGIN,
      (value) => updates.push(value),
      (value) => updates.push(value),
    );
    try {
      await Testing.retry(1_000, { silent: true, delay: 10 }, () => {
        expect(signals.length).to.eql(2);
      });
      stop();
      // Allow the aborted request continuations to settle before checking for late updates.
      await Time.wait(0);
      expect(signals.map((signal) => signal.aborted)).to.eql([true, true]);
      expect(updates).to.eql([]);
    } finally {
      stop();
    }
  });
});

/** Exercise the real Fetch and Pkg helpers with immediate HTTP responses. */
async function fetchPair(message: Response, manifest: Response) {
  await using f = controlledPair();
  f.message.resolve(message);
  f.manifest.resolve(manifest);
  await Testing.retry(100, { silent: true, delay: 10 }, () => {
    expect(f.messages.length).to.eql(1);
    expect(f.digests.length).to.eql(1);
  });
  expect(f.checksums.length).to.eql(1);
  return { message: f.messages[0], digest: f.digests[0], checksum: f.checksums[0], urls: f.urls };
}

/** Suite-local transport controls; deliberately ignores abort so late replies remain possible. */
function controlledPair() {
  const message = Promise.withResolvers<Response>();
  const manifest = Promise.withResolvers<Response>();
  const urls: string[] = [];
  const messages: string[] = [];
  const digests: string[] = [];
  const checksums: string[] = [];
  const mock = WebFixture.Fetch.mock((input, init) => {
    const req = new Request(input, init);
    urls.push(req.url);
    if (req.url === `${ORIGIN}/api/hello`) return message.promise;
    if (req.url === `${ORIGIN}/ui/dist.json`) return manifest.promise;
    throw new Error(`Unexpected fixture request: ${req.url}`);
  });
  const stop = startFetches(
    ORIGIN,
    (value) => messages.push(value),
    (value, checksum) => {
      digests.push(value);
      checksums.push(checksum);
    },
  );
  return {
    message,
    manifest,
    urls,
    messages,
    digests,
    checksums,
    stop,
    async [Symbol.asyncDispose]() {
      using _restoreFetch = mock;
      stop();
      // Release withheld responses, then let cancellation settle before restoring fetch.
      message.resolve(new Response(null, { status: 204 }));
      manifest.resolve(new Response(null, { status: 204 }));
      await Time.wait(0);
    },
  };
}
