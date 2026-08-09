import { describe, Err, expect, Fs, it, Rx, type t, Testing, Time } from '../../../-test.ts';
import { Http } from '../../../http.client/mod.ts';
import { HttpPull } from '../mod.ts';
import { createStarter } from '../u/u.start.ts';
import { cleanupRoots, localhost, resource, resourcePolicy, rooted } from './u.fixture.ts';

function start(
  resources: readonly t.HttpPull.Resource[],
  owner: t.Fs.Rooted.Instance,
  policy: t.HttpPull.ResourcePolicy = resourcePolicy(resources),
  input: Pick<t.HttpPull.StartOptions, 'credentials' | 'until'> = {},
): t.HttpPull.ResourceOperation.Instance {
  return HttpPull.start({ resources, rooted: owner, policy, ...input });
}

function failure(result: t.HttpPull.Result): t.HttpPull.ResourceRecordFailure {
  const record = result.ops[0];
  if (!record || record.ok) throw new Error('Expected checksum-pinned Pull failure');
  return record;
}

function retryStarter(resource: t.HttpPull.Resource) {
  let attempts = 0;
  const start = createStarter((options) => {
    const client = Http.Fetch.make(options);
    const wrapped = Object.create(client) as t.HttpFetch.Instance;
    const blob: t.HttpFetch.Instance['blob'] = (input, _init, requestOptions = {}) => {
      attempts++;
      const url = String(input);
      const loaded = attempts === 1 ? 3 : 4;
      requestOptions.onProgress?.({
        requestedUrl: url,
        finalUrl: url,
        loaded,
        total: loaded,
        complete: true,
      });
      if (attempts === 1) {
        const error: t.HttpFetch.Error = {
          ...Err.std('Transport failed'),
          status: 520,
          statusText: 'HTTP Client Error',
          headers: {},
        };
        return Promise.resolve({
          ok: false,
          status: 520,
          statusText: 'HTTP Client Error',
          headers: new Headers(),
          url,
          data: undefined,
          error,
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        data: new Blob(['good']),
        error: undefined,
        requestedUrl: url,
        finalUrl: url,
        checksum: {
          valid: true,
          expected: resource.checksum,
          actual: resource.checksum,
        },
      });
    };
    Object.defineProperty(wrapped, 'blob', { value: blob });
    return wrapped;
  });
  return { start, attempts: () => attempts };
}

describe('HttpPull.start bounded operation policy', () => {
  Testing.Bdd.afterEach(cleanupRoots);

  it('rejects every malformed finite bound before Rooted admission or transport', async () => {
    let admissions = 0;
    let requests = 0;
    const server = Testing.Http.server((req) => {
      requests++;
      return Testing.Http.text(req, 'content');
    });
    try {
      const source = localhost(server.url.join('content.txt'));
      const resources = [resource(source, 'content.txt', 'content')];
      const owner = await rooted();
      const destination: t.Fs.Rooted.Instance = Object.freeze({
        ...owner,
        admit: async (targets, options) => {
          admissions++;
          return await owner.admit(targets, options);
        },
      });
      const base = resourcePolicy(resources);
      const invalid = [
        { ...base, maxResources: -1 },
        { ...base, concurrency: 0 },
        { ...base, maxAttempts: 0 },
        { ...base, retryDelay: -1 },
        { ...base, maxRetryElapsed: -1 },
        { ...base, maxTotalBytes: -1 },
        { ...base, totalTimeout: 0 },
        { ...base, concurrency: Number.POSITIVE_INFINITY },
        {
          ...base,
          maxResources: 2,
          concurrency: 2,
          maxTotalBytes: Number.MAX_SAFE_INTEGER - 4_294_967_295,
        },
        { ...base, maxResources: Number.MAX_SAFE_INTEGER, maxAttempts: 2 },
        { ...base, response: { ...base.response, timeout: 0 } },
        { ...base, response: { ...base.response, sourceOrigins: [] } },
      ] as readonly t.HttpPull.ResourcePolicy[];

      for (const policy of invalid) {
        const result = await start(resources, destination, policy).done;
        expect(result.ok).to.eql(false);
        expect(result.terminal?.kind).to.eql('invalid-policy');
        expect(result.ops).to.eql([]);
      }
      expect(admissions).to.eql(0);
      expect(requests).to.eql(0);
    } finally {
      await server.dispose();
    }
  });

  it('rejects client injection and unknown operation authority before admission', async () => {
    let admissions = 0;
    const resources = [resource('https://example.test/file', 'file', 'content')];
    const owner = await rooted();
    const destination: t.Fs.Rooted.Instance = Object.freeze({
      ...owner,
      admit: async (targets, options) => {
        admissions++;
        return await owner.admit(targets, options);
      },
    });
    const injected = Http.Fetch.make({ policy: resourcePolicy(resources).response });
    const input = {
      resources,
      rooted: destination,
      policy: resourcePolicy(resources),
      client: injected,
    } as unknown as t.HttpPull.StartOptions;

    const result = await HttpPull.start(input).done;
    injected.dispose();

    expect(result.ok).to.eql(false);
    expect(result.terminal?.kind).to.eql('invalid-input');
    expect(result.ops).to.eql([]);
    expect(admissions).to.eql(0);
  });

  it('enforces the per-attempt body bound while charging the rejected stream chunk', async () => {
    const body = new Uint8Array([1, 2, 3, 4, 5, 6]);
    const server = Testing.Http.server(() =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(body.slice(0, 3));
            controller.enqueue(body.slice(3));
            controller.close();
          },
        }),
      )
    );
    try {
      const source = localhost(server.url.join('bounded.bin'));
      const resources = [resource(source, 'bounded.bin', body, undefined)];
      const owner = await rooted();

      const result = await start(
        resources,
        owner,
        resourcePolicy(resources, { response: { maxBytes: 5 } }),
      ).done;

      expect(result.ok).to.eql(false);
      expect(failure(result).kind).to.eql('file-limit');
      expect(failure(result).transferredBytes).to.eql(6);
      expect(result.totals.transferredBytes).to.eql(6);
      expect(await Fs.exists(Fs.join(owner.path, 'bounded.bin'))).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('enforces maxResources before reading resource entries or admitting targets', async () => {
    let sourceReads = 0;
    let admissions = 0;
    const owner = await rooted();
    const resourceValue = Object.defineProperty({}, 'source', {
      get() {
        sourceReads++;
        return 'https://example.test/content';
      },
    }) as t.HttpPull.Resource;
    const destination: t.Fs.Rooted.Instance = Object.freeze({
      ...owner,
      admit: async (targets, options) => {
        admissions++;
        return await owner.admit(targets, options);
      },
    });
    const resources = [resourceValue];
    const policy = resourcePolicy([], { maxResources: 0 });

    const result = await start(resources, destination, policy).done;

    expect(result.ok).to.eql(false);
    expect(result.terminal?.kind).to.eql('resource-limit');
    expect(result.totals.resources).to.eql(1);
    expect(sourceReads).to.eql(0);
    expect(admissions).to.eql(0);
  });

  it('bounds concurrent workers without changing input-ordered terminal records', async () => {
    let active = 0;
    let maximum = 0;
    const server = Testing.Http.server(async (request) => {
      active++;
      maximum = Math.max(maximum, active);
      await Time.wait(20);
      active--;
      return Testing.Http.text(request, new URL(request.url).pathname.slice(1));
    });
    try {
      const sources = ['a', 'b', 'c', 'd'].map((name) => localhost(server.url.join(`${name}.txt`)));
      const resources = sources.map((source, index) =>
        resource(source, `${index}.txt`, `${String.fromCharCode(97 + index)}.txt`)
      );
      const owner = await rooted();

      const result = await start(resources, owner, resourcePolicy(resources, { concurrency: 2 }))
        .done;

      expect(result.ok).to.eql(true);
      expect(maximum).to.eql(2);
      expect(result.ops.map((record) => record.index)).to.eql([0, 1, 2, 3]);
      expect(result.ops.map((record) => record.path.target)).to.eql([
        '0.txt',
        '1.txt',
        '2.txt',
        '3.txt',
      ]);
    } finally {
      await server.dispose();
    }
  });

  it('retries selected transient HTTP failures and never retries checksum failures', async () => {
    let transientRequests = 0;
    let checksumRequests = 0;
    const server = Testing.Http.server((request) => {
      const path = new URL(request.url).pathname;
      if (path.endsWith('/transient.txt')) {
        transientRequests++;
        return transientRequests === 1
          ? Testing.Http.error(503, 'temporary')
          : Testing.Http.text(request, 'content');
      }
      checksumRequests++;
      return Testing.Http.text(request, 'wrong');
    });
    try {
      const transientSource = localhost(server.url.join('transient.txt'));
      const checksumSource = localhost(server.url.join('checksum.txt'));
      const transient = [resource(transientSource, 'transient.txt', 'content')];
      const checksum = [resource(checksumSource, 'checksum.txt', 'expected')];
      const owner = await rooted();

      const transientResult = await start(
        transient,
        owner,
        resourcePolicy(transient, { maxAttempts: 2, retryDelay: 0 }),
      ).done;
      const checksumResult = await start(
        checksum,
        owner,
        resourcePolicy(checksum, { maxAttempts: 3 }),
      ).done;

      expect(transientResult.ok).to.eql(true);
      expect(transientResult.ops[0].attempts).to.eql(2);
      expect(transientRequests).to.eql(2);
      expect(checksumResult.ok).to.eql(false);
      expect(failure(checksumResult).kind).to.eql('checksum-mismatch');
      expect(failure(checksumResult).attempts).to.eql(1);
      expect(checksumRequests).to.eql(1);
    } finally {
      await server.dispose();
    }
  });

  it('stops repeated transient responses at maxAttempts', async () => {
    let requests = 0;
    const server = Testing.Http.server(() => {
      requests++;
      return Testing.Http.error(503, 'temporary');
    });
    try {
      const source = localhost(server.url.join('attempts.txt'));
      const resources = [resource(source, 'attempts.txt', 'content')];
      const owner = await rooted();

      const result = await start(
        resources,
        owner,
        resourcePolicy(resources, { maxAttempts: 2, retryDelay: 0 }),
      ).done;

      expect(result.ok).to.eql(false);
      expect(failure(result).kind).to.eql('request-failure');
      expect(failure(result).attempts).to.eql(2);
      expect(requests).to.eql(2);
    } finally {
      await server.dispose();
    }
  });

  it('charges body bytes from a failed retry attempt before later success', async () => {
    const source = 'https://example.test/retry.txt';
    const resources = [resource(source, 'retry.txt', 'good')];
    const owner = await rooted();
    const mock = retryStarter(resources[0]);

    const result = await mock.start({
      resources,
      rooted: owner,
      policy: resourcePolicy(resources, { maxAttempts: 2, retryDelay: 0 }),
    }).done;

    expect(result.ok).to.eql(true);
    expect(result.ops[0].attempts).to.eql(2);
    expect(result.ops[0].transferredBytes).to.eql(7);
    expect(result.totals.transferredBytes).to.eql(7);
    expect(result.totals.publishedBytes).to.eql(4);
    expect(mock.attempts()).to.eql(2);
  });

  it('terminates at the aggregate byte bound across failed attempts and publishes nothing later', async () => {
    const source = 'https://example.test/aggregate.txt';
    const resources = [resource(source, 'aggregate.txt', 'good', undefined)];
    const owner = await rooted();
    const mock = retryStarter(resources[0]);

    const result = await mock.start({
      resources,
      rooted: owner,
      policy: resourcePolicy(resources, {
        maxAttempts: 2,
        retryDelay: 0,
        maxTotalBytes: 6,
      }),
    }).done;

    expect(result.ok).to.eql(false);
    expect(result.terminal?.kind).to.eql('aggregate-limit');
    expect(failure(result).kind).to.eql('aggregate-limit');
    expect(result.totals.transferredBytes).to.eql(7);
    expect(result.totals.publishedBytes).to.eql(0);
    expect(mock.attempts()).to.eql(2);
    expect(await Fs.exists(Fs.join(owner.path, 'aggregate.txt'))).to.eql(false);
  });

  it('bounds retry elapsed time including delay and does not start a late attempt', async () => {
    let requests = 0;
    const server = Testing.Http.server(() => {
      requests++;
      return Testing.Http.error(503, 'temporary');
    });
    try {
      const source = localhost(server.url.join('retry-limit.txt'));
      const resources = [resource(source, 'retry-limit.txt', 'content')];
      const owner = await rooted();

      const result = await start(
        resources,
        owner,
        resourcePolicy(resources, {
          maxAttempts: 3,
          retryDelay: 30,
          maxRetryElapsed: 5,
        }),
      ).done;

      expect(result.ok).to.eql(false);
      expect(failure(result).kind).to.eql('retry-limit');
      expect(failure(result).attempts).to.eql(1);
      expect(requests).to.eql(1);
    } finally {
      await server.dispose();
    }
  });

  it('aborts an in-flight retry when maxRetryElapsed expires', async () => {
    let requests = 0;
    let release: () => void = () => {};
    const released = new Promise<void>((resolve) => release = resolve);
    const server = Testing.Http.server(async (request) => {
      requests++;
      if (requests === 1) return Testing.Http.error(503, 'temporary');
      await released;
      return Testing.Http.text(request, 'content');
    });
    try {
      const source = localhost(server.url.join('retry-timeout.txt'));
      const resources = [resource(source, 'retry-timeout.txt', 'content')];
      const owner = await rooted();

      const result = await start(
        resources,
        owner,
        resourcePolicy(resources, {
          maxAttempts: 2,
          retryDelay: 0,
          maxRetryElapsed: 20,
          response: { timeout: 1000 },
        }),
      ).done;

      expect(result.ok).to.eql(false);
      expect(failure(result).kind).to.eql('retry-limit');
      expect(failure(result).attempts).to.eql(2);
      expect(requests).to.eql(2);
      expect(await Fs.exists(Fs.join(owner.path, 'retry-timeout.txt'))).to.eql(false);
    } finally {
      release();
      await server.dispose();
    }
  });

  it('confines credentials to admitted credential origins across redirects', async () => {
    const token = 'Bearer CREDENTIAL-SECRET';
    let firstAuthorization: string | null = null;
    let redirectedAuthorization: string | null = null;
    const target = Testing.Http.server((request) => {
      redirectedAuthorization = request.headers.get('authorization');
      return Testing.Http.text(request, 'content');
    });
    const source = Testing.Http.server((request) => {
      firstAuthorization = request.headers.get('authorization');
      return new Response(null, {
        status: 302,
        headers: { location: localhost(target.url.join('content.txt')) },
      });
    });
    try {
      const url = localhost(source.url.join('redirect.txt'));
      const final = localhost(target.url.join('content.txt'));
      const resources = [resource(url, 'content.txt', 'content')];
      const policy = resourcePolicy(resources, {
        response: {
          sourceOrigins: [new URL(url).origin, new URL(final).origin],
          credentialOrigins: [new URL(url).origin],
        },
      });
      const owner = await rooted();

      const result = await start(resources, owner, policy, {
        credentials: { accessToken: token },
      }).done;

      expect(result.ok).to.eql(true);
      expect(firstAuthorization).to.eql(token);
      expect(redirectedAuthorization).to.eql(null);
      expect(result.ops[0].requestedUrl).to.eql(url);
      expect(result.ops[0].finalUrl).to.eql(final);
    } finally {
      await source.dispose();
      await target.dispose();
    }
  });

  it('snapshots credential callbacks before admission and sanitizes callback failures', async () => {
    let admissions = 0;
    let requests = 0;
    const server = Testing.Http.server((request) => {
      requests++;
      return Testing.Http.text(request, 'content');
    });
    try {
      const source = localhost(server.url.join('credential.txt'));
      const resources = [resource(source, 'credential.txt', 'content')];
      const owner = await rooted();
      const destination: t.Fs.Rooted.Instance = Object.freeze({
        ...owner,
        admit: async (targets, options) => {
          admissions++;
          return await owner.admit(targets, options);
        },
      });

      const result = await start(resources, destination, resourcePolicy(resources), {
        credentials: {
          accessToken: () => {
            throw new Error('CREDENTIAL-SECRET');
          },
        },
      }).done;

      expect(result.ok).to.eql(false);
      expect(result.terminal?.kind).to.eql('invalid-input');
      expect(JSON.stringify(result).includes('CREDENTIAL-SECRET')).to.eql(false);
      expect(admissions).to.eql(0);
      expect(requests).to.eql(0);
    } finally {
      await server.dispose();
    }
  });

  it('rejects asynchronous credential callbacks before admission or transport', async () => {
    let admissions = 0;
    let requests = 0;
    const server = Testing.Http.server((request) => {
      requests++;
      return Testing.Http.text(request, 'content');
    });
    try {
      const source = localhost(server.url.join('async-credential.txt'));
      const resources = [resource(source, 'async-credential.txt', 'content')];
      const owner = await rooted();
      const destination: t.Fs.Rooted.Instance = Object.freeze({
        ...owner,
        admit: async (targets, options) => {
          admissions++;
          return await owner.admit(targets, options);
        },
      });
      const accessToken = (() => Promise.resolve('private-token')) as unknown as NonNullable<
        t.HttpFetch.CreateOptions['accessToken']
      >;
      const headers = (() => Promise.resolve()) as unknown as t.HttpFetch.Mutate.Headers;

      for (const credentials of [{ accessToken }, { headers }]) {
        const result = await start(resources, destination, resourcePolicy(resources), {
          credentials,
        }).done;

        expect(result.ok).to.eql(false);
        expect(result.terminal?.kind).to.eql('invalid-input');
      }
      expect(admissions).to.eql(0);
      expect(requests).to.eql(0);
    } finally {
      await server.dispose();
    }
  });

  it('disposes its internally owned Fetch capability exactly once', async () => {
    const server = Testing.Http.server((request) => Testing.Http.text(request, 'content'));
    try {
      const source = localhost(server.url.join('owned.txt'));
      const resources = [resource(source, 'owned.txt', 'content')];
      const policy = resourcePolicy(resources);
      const owner = await rooted();
      let disposals = 0;
      const starter = createStarter((options) => {
        const client = Http.Fetch.make(options);
        const wrapped = Object.create(client) as t.HttpFetch.Instance;
        Object.defineProperty(wrapped, 'dispose', {
          value(reason?: unknown) {
            disposals++;
            client.dispose(reason);
          },
        });
        return wrapped;
      });

      const result = await starter({ resources, rooted: owner, policy }).done;

      expect(result.ok).to.eql(true);
      expect(disposals).to.eql(1);
    } finally {
      await server.dispose();
    }
  });

  it('keeps disposed event views isolated from operation and sibling completion', async () => {
    const server = Testing.Http.server(async (request) => {
      await Time.wait(10);
      return Testing.Http.text(request, 'content');
    });
    try {
      const source = localhost(server.url.join('views.txt'));
      const resources = [resource(source, 'views.txt', 'content')];
      const owner = await rooted();
      const operation = start(resources, owner);
      const local = Rx.disposable();
      const localView = operation.events(local.dispose$);
      const siblingEvents: t.HttpPull.ResourceEvent.Any[] = [];
      const sibling = operation.events();
      const subscription = sibling.$.subscribe((event) => siblingEvents.push(event));

      local.dispose('view:complete');
      const result = await operation.done;
      subscription.unsubscribe();

      expect(localView.disposed).to.eql(true);
      expect(result.ok).to.eql(true);
      expect(sibling.disposed).to.eql(true);
      expect(siblingEvents.some((event) => event.kind === 'done')).to.eql(true);
    } finally {
      await server.dispose();
    }
  });
});
