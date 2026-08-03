import { describe, expect, expectTypeOf, Fs, it, type t, Testing } from '../../../-test.ts';
import { Hash } from '../../common.ts';
import { HttpPull } from '../mod.ts';
import {
  cleanupRoots,
  localhost,
  resource,
  resourcePolicy,
  rooted,
  rootedFailure,
} from './u.fixture.ts';

const encoder = new TextEncoder();

function start(
  resources: readonly t.HttpPull.Resource[],
  owner: t.Fs.Rooted.Instance,
  policy: t.HttpPull.ResourcePolicy = resourcePolicy(resources),
  input: Pick<t.HttpPull.StartOptions, 'credentials' | 'until'> = {},
): t.HttpPull.ResourceOperation.Instance {
  return HttpPull.start({ resources, rooted: owner, policy, ...input });
}

function asFailure(record: t.HttpPull.ResourceRecord): t.HttpPull.ResourceRecordFailure {
  if (record.ok) throw new Error('Expected checksum-pinned Pull failure');
  return record;
}

describe('HttpPull checksum-pinned resources', () => {
  Testing.Bdd.afterEach(cleanupRoots);

  it('exposes one start surface while legacy names accept URL arrays only', async () => {
    expectTypeOf(HttpPull.start).toEqualTypeOf<
      (options: t.HttpPull.StartOptions) => t.HttpPull.ResourceOperation.Instance
    >();
    expectTypeOf(HttpPull.toDir).toEqualTypeOf<
      (
        urls: readonly string[],
        dir: t.StringDir,
        options: t.HttpPull.Options,
      ) => Promise<t.HttpPull.ToDir.Result>
    >();
    expectTypeOf(HttpPull.stream).toEqualTypeOf<
      (
        urls: readonly string[],
        dir: t.StringDir,
        options: t.HttpPull.Options,
      ) => t.HttpPull.Stream.Instance
    >();

    const owner = await rooted();
    const operation = start([], owner, resourcePolicy([], { maxResources: 0 }));
    expect(Symbol.asyncIterator in operation).to.eql(false);
    expect(await operation.done).to.eql({
      ok: true,
      ops: [],
      totals: { resources: 0, attempts: 0, transferredBytes: 0, publishedBytes: 0 },
    });
  });

  it('publishes exact authenticated bytes with source, checksum, size, and commit evidence', async () => {
    const content = 'rooted-content';
    const server = Testing.Http.server((req) => Testing.Http.text(req, content));
    try {
      const source = `${localhost(server.url.join('url-derived', 'ignored.txt'))}?v=1`;
      const resources = [resource(source, './assets//explicit.bin', content)];
      const owner = await rooted();

      const result = await start(resources, owner).done;

      expect(result.ok).to.eql(true);
      expect(result.ops).to.have.length(1);
      const record = result.ops[0];
      expect(record).to.include({
        ok: true,
        index: 0,
        attempts: 1,
        transferredBytes: encoder.encode(content).byteLength,
        actualBytes: encoder.encode(content).byteLength,
        bytes: encoder.encode(content).byteLength,
        requestedUrl: source,
        finalUrl: source,
      });
      expect(record.path).to.eql({
        source: localhost(server.url.join('url-derived', 'ignored.txt')),
        target: 'assets/explicit.bin',
      });
      expect(record.checksum).to.eql({
        valid: true,
        expected: resources[0].checksum,
        actual: resources[0].checksum,
      });
      expect(record.filesystem).to.eql({ operation: 'publish-file', committed: true });
      expect(result.totals).to.eql({
        resources: 1,
        attempts: 1,
        transferredBytes: encoder.encode(content).byteLength,
        publishedBytes: encoder.encode(content).byteLength,
      });
      expect(await Fs.readText(Fs.join(owner.path, 'assets/explicit.bin'))).to.include({
        ok: true,
        data: content,
      });
      expect(await Fs.exists(Fs.join(owner.path, 'url-derived', 'ignored.txt'))).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('snapshots every resource and policy value before asynchronous admission', async () => {
    const server = Testing.Http.server((req) => Testing.Http.text(req, 'stable'));
    try {
      const source = localhost(server.url.join('stable.txt'));
      const mutable = { ...resource(source, 'stable.txt', 'stable') };
      const resources: readonly t.HttpPull.Resource[] = [mutable];
      const mutablePolicy = {
        ...resourcePolicy(resources),
        response: { ...resourcePolicy(resources).response },
      };
      const owner = await rooted();
      const operation = start(resources, owner, mutablePolicy);

      mutable.source = 'https://example.test/mutated.txt';
      mutable.target = '../mutated.txt';
      mutable.checksum = Hash.sha256(encoder.encode('mutated'));
      mutable.expectedBytes = 1;
      mutablePolicy.maxTotalBytes = 0;
      mutablePolicy.response.sourceOrigins = ['https://example.test'];

      const result = await operation.done;
      expect(result.ok).to.eql(true);
      expect(result.ops[0].path.target).to.eql('stable.txt');
      expect(await Fs.readText(Fs.join(owner.path, 'stable.txt'))).to.include({
        ok: true,
        data: 'stable',
      });
    } finally {
      await server.dispose();
    }
  });

  it('completes full target admission before creating transport or making a request', async () => {
    let admitted = false;
    let requestBeforeAdmission = false;
    const server = Testing.Http.server((req) => {
      requestBeforeAdmission ||= !admitted;
      return Testing.Http.text(req, 'content');
    });
    try {
      const source = localhost(server.url.join('content.txt'));
      const resources = [resource(source, 'admitted/content.txt', 'content')];
      const owner = await rooted();
      const destination: t.Fs.Rooted.Instance = Object.freeze({
        path: owner.path,
        admit: async (targets, options) => {
          const result = await owner.admit(targets, options);
          admitted = true;
          return result;
        },
        publishFile: owner.publishFile,
        createStage: owner.createStage,
        discardStage: owner.discardStage,
        promoteStage: owner.promoteStage,
      });

      const result = await start(resources, destination).done;

      expect(result.ok).to.eql(true);
      expect(admitted).to.eql(true);
      expect(requestBeforeAdmission).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('fails closed on hostile batch and resource getters without admission or network work', async () => {
    let admissions = 0;
    let requests = 0;
    const server = Testing.Http.server((req) => {
      requests++;
      return Testing.Http.text(req, 'content');
    });
    try {
      const source = localhost(server.url.join('content.txt'));
      const authority = [resource(source, 'content.txt', 'content')];
      const hostile = Object.defineProperty({}, 'source', {
        enumerable: true,
        get(): never {
          throw new Error('RESOURCE-SECRET');
        },
      }) as t.HttpPull.Resource;
      const owner = await rooted();
      const destination: t.Fs.Rooted.Instance = Object.freeze({
        ...owner,
        admit: async (targets, options) => {
          admissions++;
          return await owner.admit(targets, options);
        },
      });

      const resourceResult = await start([hostile], destination, resourcePolicy(authority)).done;
      const hostileBatch = new Proxy([] as t.HttpPull.Resource[], {
        get(target, property, receiver) {
          if (property === 'length') throw new Error('BATCH-SECRET');
          return Reflect.get(target, property, receiver);
        },
      });
      const batchResult = await HttpPull.start({
        resources: hostileBatch,
        rooted: destination,
        policy: resourcePolicy(authority),
      }).done;

      expect(resourceResult.ok).to.eql(false);
      expect(resourceResult.terminal?.kind).to.eql('invalid-resource');
      expect(resourceResult.ops[0].error).to.eql('Invalid checksum-pinned pull resource');
      expect(batchResult.ok).to.eql(false);
      expect(batchResult.terminal?.kind).to.eql('invalid-input');
      expect(batchResult.ops).to.eql([]);
      expect(JSON.stringify([resourceResult, batchResult]).includes('SECRET')).to.eql(false);
      expect(admissions).to.eql(0);
      expect(requests).to.eql(0);
    } finally {
      await server.dispose();
    }
  });

  it('rejects source authority, unsafe targets, and target collisions before transport', async () => {
    let requests = 0;
    const server = Testing.Http.server((req) => {
      requests++;
      return Testing.Http.text(req, 'content');
    });
    try {
      const source = `${localhost(server.url.join('content.txt'))}?token=SOURCE-SECRET`;
      const cases: readonly (readonly t.HttpPull.Resource[])[] = [
        [resource('https://denied.example/file', 'denied.txt', 'content')],
        [resource(source, '../outside.txt', 'content')],
        [resource(source, '/absolute.txt', 'content')],
        [resource(source, 'nested\\backslash.txt', 'content')],
        [resource(source, './same.txt', 'content'), resource(source, 'same.txt', 'content')],
        [resource(source, 'pkg', 'content'), resource(source, 'pkg/entry.js', 'content')],
      ];

      for (const resources of cases) {
        const owner = await rooted();
        const policy = resourcePolicy(resources, {
          response: { sourceOrigins: [new URL(source).origin] },
        });
        const result = await start(resources, owner, policy).done;
        expect(result.ok).to.eql(false);
        expect(result.ops.every((record) => !record.ok)).to.eql(true);
        expect(JSON.stringify(result).includes('SOURCE-SECRET')).to.eql(false);
      }
      expect(requests).to.eql(0);
    } finally {
      await server.dispose();
    }
  });

  it('rejects unknown resource authority, malformed checksums, and known bounds preflight', async () => {
    let admissions = 0;
    let requests = 0;
    const server = Testing.Http.server((req) => {
      requests++;
      return Testing.Http.text(req, 'content');
    });
    try {
      const source = localhost(server.url.join('content.txt'));
      const authority = [resource(source, 'authority.txt', 'content')];
      const owner = await rooted();
      const destination: t.Fs.Rooted.Instance = Object.freeze({
        ...owner,
        admit: async (targets, options) => {
          admissions++;
          return await owner.admit(targets, options);
        },
      });
      const unknown = {
        ...authority[0],
        client: 'UNADMITTED-RESOURCE-AUTHORITY',
      } as unknown as t.HttpPull.Resource;
      const cases = [
        [unknown],
        [{ ...authority[0], checksum: 'sha256-NOT-CANONICAL' }],
        [{ ...authority[0], expectedBytes: -1 }],
        [authority[0]],
        [authority[0], resource(source, 'second.txt', 'content')],
      ] as readonly (readonly t.HttpPull.Resource[])[];
      const policies = [
        resourcePolicy(authority),
        resourcePolicy(authority),
        resourcePolicy(authority),
        resourcePolicy(authority, { response: { maxBytes: 1 } }),
        resourcePolicy(cases[4], { maxTotalBytes: 8 }),
      ];

      for (let index = 0; index < cases.length; index++) {
        const result = await start(cases[index], destination, policies[index]).done;
        expect(result.ok).to.eql(false);
        if (index === 0) {
          expect(result.terminal?.kind).to.eql('invalid-resource');
          expect(JSON.stringify(result).includes('UNADMITTED-RESOURCE-AUTHORITY')).to.eql(false);
        }
      }
      expect(admissions).to.eql(0);
      expect(requests).to.eql(0);
    } finally {
      await server.dispose();
    }
  });

  it('rejects checksum and exact-size mismatches before publication', async () => {
    const content = 'actual-content';
    const server = Testing.Http.server((req) => Testing.Http.text(req, content));
    try {
      const source = localhost(server.url.join('content.txt'));
      const owner = await rooted();
      const checksumResources = [resource(source, 'checksum.txt', 'different-content')];
      const sizeResources = [resource(source, 'size.txt', content, 1)];

      const checksum = await start(checksumResources, owner).done;
      const size = await start(sizeResources, owner).done;

      expect(checksum.ok).to.eql(false);
      expect(asFailure(checksum.ops[0]).kind).to.eql('checksum-mismatch');
      expect(asFailure(checksum.ops[0]).status).to.eql(412);
      expect(asFailure(checksum.ops[0]).checksum?.valid).to.eql(false);
      expect(size.ok).to.eql(false);
      expect(asFailure(size.ops[0]).kind).to.eql('size-mismatch');
      expect(await Fs.exists(Fs.join(owner.path, 'checksum.txt'))).to.eql(false);
      expect(await Fs.exists(Fs.join(owner.path, 'size.txt'))).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('never clobbers an occupied target and sanitizes Rooted failures', async () => {
    const server = Testing.Http.server((req) => Testing.Http.text(req, 'challenger'));
    try {
      const source = localhost(server.url.join('occupied.txt'));
      const resources = [resource(source, 'occupied.txt', 'challenger')];
      const owner = await rooted();
      await Fs.write(Fs.join(owner.path, 'occupied.txt'), 'winner');

      const occupied = await start(resources, owner).done;
      expect(occupied.ok).to.eql(false);
      expect(asFailure(occupied.ops[0]).kind).to.eql('publication-failure');
      expect(asFailure(occupied.ops[0]).filesystem).to.eql({
        operation: 'publish-file',
        kind: 'occupied',
        committed: false,
      });
      expect(await Fs.readText(Fs.join(owner.path, 'occupied.txt'))).to.include({
        ok: true,
        data: 'winner',
      });

      const failing: t.Fs.Rooted.Instance = Object.freeze({
        ...owner,
        publishFile: () =>
          Promise.reject(rootedFailure('publish-file', 'io-failure', 'FILESYSTEM-SECRET')),
      });
      const second = [resource(source, 'second.txt', 'challenger')];
      const failed = await start(second, failing).done;
      expect(asFailure(failed.ops[0]).filesystem?.kind).to.eql('io-failure');
      expect(JSON.stringify(failed).includes('FILESYSTEM-SECRET')).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('permits one Rooted winner across concurrent operations targeting the same file', async () => {
    const server = Testing.Http.server((req) => {
      const content = new URL(req.url).pathname.endsWith('/alpha.txt') ? 'alpha' : 'bravo';
      return Testing.Http.text(req, content);
    });
    try {
      const alphaSource = localhost(server.url.join('alpha.txt'));
      const bravoSource = localhost(server.url.join('bravo.txt'));
      const alpha = [resource(alphaSource, 'winner.txt', 'alpha')];
      const bravo = [resource(bravoSource, 'winner.txt', 'bravo')];
      const owner = await rooted();

      const results = await Promise.all([start(alpha, owner).done, start(bravo, owner).done]);

      expect(results.filter((result) => result.ok)).to.have.length(1);
      expect(results.filter((result) => !result.ok)).to.have.length(1);
      const content = await Fs.readText(Fs.join(owner.path, 'winner.txt'));
      expect(content.ok).to.eql(true);
      expect(['alpha', 'bravo']).to.include(content.data);
    } finally {
      await server.dispose();
    }
  });

  it('emits hot start/progress/done evidence without making observation an execution dependency', async () => {
    const content = 'observed-content';
    const server = Testing.Http.server((req) => Testing.Http.text(req, content));
    try {
      const source = localhost(server.url.join('observed.txt'));
      const resources = [resource(source, 'observed.txt', content)];
      const owner = await rooted();
      const operation = start(resources, owner);
      const events: t.HttpPull.ResourceEvent.Any[] = [];
      const view = operation.events();
      const subscription = view.$.subscribe((event) => events.push(event));

      const result = await operation.done;
      subscription.unsubscribe();

      expect(result.ok).to.eql(true);
      expect(events.filter((event) => event.kind === 'done')).to.have.length(1);
      expect(events.some((event) => event.kind === 'progress')).to.eql(true);
      expect(view.disposed).to.eql(true);

      const unobserved = [resource(source, 'unobserved.txt', content)];
      const unobservedResult = await start(unobserved, owner).done;
      expect(unobservedResult.ok).to.eql(true);
    } finally {
      await server.dispose();
    }
  });
});
