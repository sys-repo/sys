import { Hash } from '@sys/crypto/hash';
import {
  describe,
  expect,
  Fs,
  it,
  Json,
  Obj,
  type t,
  Testing,
  Time,
  WebFixture,
} from '../-test.ts';
import { startFetches } from '../ui/u.load.ts';
import { localFixture } from '../../-scripts/-test/u.fixture.ts';

type ManifestUpdate = {
  readonly digest: string;
  readonly checksum: string;
  readonly size?: number;
};

const ORIGIN = 'https://sample.test';
const PUBLIC_MANIFEST = 'https://assets.test/sample/ui/dist.json';
const bundleSize = 551_353;
const audiences = ['private', 'public'] as const;
// Independently chosen digests: the UI reports these, but computes checksums from received bytes.
const privateDist: t.DistPkg = {
  type: 'https://jsr.io/@sample/r2',
  build: {
    time: 0,
    size: { total: 1_575, pkg: 0 },
    builder: '@sys/driver-vite',
    runtime: 'deno',
    hash: { policy: 'https://jsr.io/@sys/crypto' },
  },
  hash: { digest: `sha256-${'a'.repeat(64)}`, parts: {} },
};
const publicDist: t.DistPkg = {
  ...privateDist,
  build: { ...privateDist.build, size: { total: bundleSize - 1_575, pkg: 0 } },
  hash: { digest: `sha256-${'b'.repeat(64)}`, parts: {} },
};
const distributions = { private: privateDist, public: publicDist };

describe('R2 deployment sample: UI fetches', () => {
  it('two origins → independent manifests and sizes, without credentials or redirects', async () => {
    const result = await fetchResponses();
    expect(result.message).to.eql('hello');
    expect(result.size).to.eql(bundleSize);
    for (const audience of audiences) {
      const dist = distributions[audience];
      expect(result[audience]).to.eql({
        digest: dist.hash.digest,
        checksum: Hash.sha256(await Response.json(dist).text()),
        size: dist.build.size.total,
      });
      expect(result[audience].size).not.to.eql(bundleSize);
    }
    expect(result.requests.map((req) => req.url).sort()).to.eql([
      PUBLIC_MANIFEST,
      `${ORIGIN}/api/bundle`,
      `${ORIGIN}/api/hello`,
      `${ORIGIN}/ui/dist.json`,
    ]);
    for (const request of result.requests) {
      expect(request.credentials).to.eql('omit');
      expect(request.redirect).to.eql('manual');
      expect(request.referrerPolicy).to.eql('no-referrer');
      expect([...request.headers]).to.eql([]);
    }
  });

  it('served projections → checksums match both build-selected manifest pins', async () => {
    await using f = await localFixture();
    const privateFile = await Fs.readText(f.dir.join('dist.private/dist.json'));
    const publicFile = await Fs.readText(f.dir.join('dist.public/dist.json'));
    expect(privateFile.ok && publicFile.ok).to.eql(true);
    const result = await fetchResponses({
      private: new Response(privateFile.data),
      public: new Response(publicFile.data),
    });
    for (const audience of audiences) {
      expect(result[audience].checksum).to.eql(f.buildRecord.selection.pins[audience]['dist.json']);
      expect(result[audience].digest).not.to.eql(result[audience].checksum);
    }
  });

  it('whitespace and UTF-8 BOM → exact-byte checksums and distribution payload sizes', async () => {
    for (const prefix of ['  \n', '\uFEFF']) {
      const privateBytes = new TextEncoder().encode(`${prefix}${Json.stringify(privateDist)}\n`);
      const publicBytes = new TextEncoder().encode(`${prefix}${Json.stringify(publicDist)}\n`);
      const result = await fetchResponses({
        private: new Response(privateBytes),
        public: new Response(publicBytes),
      });
      for (const audience of audiences) {
        const bytes = audience === 'private' ? privateBytes : publicBytes;
        const dist = distributions[audience];
        expect(result[audience].digest).to.eql(dist.hash.digest);
        expect(result[audience].checksum).to.eql(Hash.sha256(bytes));
        expect(result[audience].checksum).not.to.eql(Hash.sha256(Json.stringify(dist)));
        expect(result[audience].size).to.eql(dist.build.size.total);
        expect(result[audience].size).not.to.eql(bytes.byteLength);
      }
      expect(result.size).to.eql(bundleSize);
    }
  });

  it('API completes first → message updates while both manifests remain pending', async () => {
    await using f = controlledFetches();
    await requestsStarted(f.requests);
    f.responses.message.resolve(Response.json({ msg: 'hello' }));
    await Testing.retry(100, { silent: true, delay: 10 }, () => {
      expect(f.messages).to.eql(['hello']);
    });
    expect(f.manifests).to.eql({ private: [], public: [] });
    expect(f.sizes).to.eql([]);
  });

  for (const audience of audiences) {
    const other = audience === 'private' ? 'public' : 'private';

    it(`${audience} completes first → no wait for the other manifest, API, or bundle`, async () => {
      await using f = controlledFetches();
      await requestsStarted(f.requests);
      f.responses[audience].resolve(Response.json(distributions[audience]));
      await Testing.retry(100, { silent: true, delay: 10 }, () => {
        expect(f.manifests[audience].length).to.eql(1);
      });
      expect(f.manifests[audience][0].digest).to.eql(distributions[audience].hash.digest);
      expect(f.manifests[other]).to.eql([]);
      expect(f.messages).to.eql([]);
      expect(f.sizes).to.eql([]);
    });

    it(`invalid or failed ${audience} manifest → isolated error and no invented size`, async () => {
      const responses = [
        new Response(null, { status: 404 }),
        new Response(null, { status: 302, headers: { location: PUBLIC_MANIFEST + '?redirect' } }),
        new Response('{broken'),
        Response.json({ hash: { digest: privateDist.hash.digest } }),
        Response.json({ ...privateDist, hash: { digest: 'not-a-hash', parts: {} } }),
        new Response(new Uint8Array([255, 255])),
        new Response(' '.repeat(65_537)),
        ...[undefined, null, '1575', -1, 1.5, Number.MAX_SAFE_INTEGER + 1].map((size) =>
          Response.json({
            ...privateDist,
            build: { ...privateDist.build, size: { total: size, pkg: 0 } },
          })
        ),
      ];
      for (const response of responses) {
        const result = await fetchResponses({ [audience]: response });
        expect(result[audience]).to.eql({
          digest: `Could not load the ${audience} manifest.`,
          checksum: `Could not load the ${audience} manifest.`,
          size: undefined,
        });
        expect(result[other].digest).to.eql(distributions[other].hash.digest);
        expect(result.message).to.eql('hello');
        expect(result.size).to.eql(bundleSize);
        expect(result.requests.length).to.eql(4);
      }
    });

    it(`disposal → a late ${audience} response is cancelled without updating the view`, async () => {
      await using f = controlledFetches();
      await requestsStarted(f.requests);
      f.stop();
      let cancelled = false;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(Json.stringify(distributions[audience])));
        },
        cancel() {
          cancelled = true;
        },
      });
      f.responses[audience].resolve(new Response(body));
      await Testing.retry(100, { silent: true, delay: 10 }, () => expect(cancelled).to.eql(true));
      expect(f.manifests).to.eql({ private: [], public: [] });
    });
  }

  it('public transport failure → private manifest and API remain available', async () => {
    await using f = controlledFetches();
    await requestsStarted(f.requests);
    f.responses.public.reject(new TypeError('Failed to fetch'));
    f.responses.private.resolve(Response.json(privateDist));
    f.responses.message.resolve(Response.json({ msg: 'hello' }));
    await Testing.retry(100, { silent: true, delay: 10 }, () => {
      expect(f.manifests.private.length).to.eql(1);
      expect(f.manifests.public.length).to.eql(1);
      expect(f.messages).to.eql(['hello']);
    });
    expect(f.manifests.private[0].digest).to.eql(privateDist.hash.digest);
    expect(f.manifests.public[0].digest).to.eql('Could not load the public manifest.');
  });

  it('invalid or failed bundle total → no fallback to either manifest size', async () => {
    const responses = [
      new Response(null, { status: 404 }),
      new Response('{broken'),
      ...[undefined, null, '551353', -1, 1.5, Number.MAX_SAFE_INTEGER + 1].map(
        (size) => Response.json({ size }),
      ),
    ];
    for (const bundle of responses) {
      const result = await fetchResponses({ bundle });
      expect(result.size).to.eql(undefined);
      expect(result.private.digest).to.eql(privateDist.hash.digest);
      expect(result.public.digest).to.eql(publicDist.hash.digest);
      expect(result.message).to.eql('hello');
    }
    const empty = await fetchResponses({ bundle: Response.json({ size: 0 }) });
    expect(empty.size).to.eql(0);
  });

  it('invalid API reply → message error without losing either manifest', async () => {
    const result = await fetchResponses({ message: Response.json({ msg: 123 }) });
    expect(result.message).to.eql('Could not load the message.');
    expect(result.private.digest).to.eql(privateDist.hash.digest);
    expect(result.public.digest).to.eql(publicDist.hash.digest);
  });

  it('bundle completes first → independent size; disposal suppresses a late total', async () => {
    for (const disposed of [false, true]) {
      await using f = controlledFetches();
      await requestsStarted(f.requests);
      if (disposed) f.stop();
      f.responses.bundle.resolve(Response.json({ size: bundleSize }));
      if (disposed) await Time.wait(0);
      else {
        await Testing.retry(100, { silent: true, delay: 10 }, () => {
          expect(f.sizes).to.eql([bundleSize]);
        });
      }
      expect(f.sizes).to.eql(disposed ? [] : [bundleSize]);
      expect(f.manifests).to.eql({ private: [], public: [] });
      expect(f.messages).to.eql([]);
    }
  });

  it('disposal → all four requests abort without updating the view', async () => {
    await using f = controlledFetches();
    await requestsStarted(f.requests);
    f.stop();
    for (const [, response] of Obj.entries(f.responses)) response.resolve(new Response(null));
    await Time.wait(0);
    expect(f.requests.map((req) => req.signal.aborted)).to.eql([true, true, true, true]);
    expect(f.manifests).to.eql({ private: [], public: [] });
    expect(f.messages).to.eql([]);
    expect(f.sizes).to.eql([]);
  });
});

/** Exercise the real Fetch and Pkg helpers with immediate HTTP responses. */
async function fetchResponses(input: {
  message?: Response;
  private?: Response;
  public?: Response;
  bundle?: Response;
} = {}) {
  await using f = controlledFetches();
  f.responses.message.resolve(input.message ?? Response.json({ msg: 'hello' }));
  f.responses.private.resolve(input.private ?? Response.json(privateDist));
  f.responses.public.resolve(input.public ?? Response.json(publicDist));
  f.responses.bundle.resolve(input.bundle ?? Response.json({ size: bundleSize }));
  await Testing.retry(100, { silent: true, delay: 10 }, () => {
    expect(f.messages.length).to.eql(1);
    expect(f.manifests.private.length).to.eql(1);
    expect(f.manifests.public.length).to.eql(1);
    expect(f.sizes.length).to.eql(1);
  });
  return {
    message: f.messages[0],
    private: f.manifests.private[0],
    public: f.manifests.public[0],
    size: f.sizes[0],
    requests: f.requests,
  };
}

/** Hold responses until the test releases them, even after the request is aborted. */
function controlledFetches() {
  const responses = {
    message: Promise.withResolvers<Response>(),
    private: Promise.withResolvers<Response>(),
    public: Promise.withResolvers<Response>(),
    bundle: Promise.withResolvers<Response>(),
  };
  const requests: Request[] = [];
  const messages: string[] = [];
  const manifests: Record<t.Audience, ManifestUpdate[]> = { private: [], public: [] };
  const sizes: (number | undefined)[] = [];
  const mock = WebFixture.Fetch.mock((input, init) => {
    const req = new Request(input, init);
    requests.push(req);
    if (req.url === `${ORIGIN}/api/hello`) return responses.message.promise;
    if (req.url === `${ORIGIN}/api/bundle`) return responses.bundle.promise;
    if (req.url === `${ORIGIN}/ui/dist.json`) return responses.private.promise;
    if (req.url === PUBLIC_MANIFEST) return responses.public.promise;
    throw new Error(`Unexpected fixture request: ${req.url}`);
  });
  const stop = startFetches(
    ORIGIN,
    PUBLIC_MANIFEST,
    (value) => messages.push(value),
    (audience, digest, checksum, size) => manifests[audience].push({ digest, checksum, size }),
    (size) => sizes.push(size),
  );
  return {
    responses,
    requests,
    messages,
    manifests,
    sizes,
    stop,
    async [Symbol.asyncDispose]() {
      using _restoreFetch = mock;
      stop();
      // Release withheld responses, then let cancellation settle before restoring fetch.
      for (const [, response] of Obj.entries(responses)) {
        response.resolve(new Response(null, { status: 204 }));
      }
      await Time.wait(0);
    },
  };
}

async function requestsStarted(requests: readonly Request[]) {
  await Testing.retry(1_000, { silent: true, delay: 10 }, () => expect(requests.length).to.eql(4));
}
