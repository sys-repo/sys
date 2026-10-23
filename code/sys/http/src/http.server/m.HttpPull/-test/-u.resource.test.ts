import {
  afterEach,
  describe,
  expect,
  expectTypeOf,
  Fs,
  it,
  type t,
  Testing,
} from '../../../-test.ts';
import { Hash } from '../../common.ts';
import { HttpPull } from '../mod.ts';
import { prepareStart } from '../u.resource/u.input.ts';
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
  owner: t.FsRooted.Instance,
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
  afterEach(cleanupRoots);

  it('exposes start as the sole runtime surface with one canonical terminal result', async () => {
    expect(Object.keys(HttpPull)).to.eql(['start']);
    expectTypeOf(HttpPull.start).toEqualTypeOf<
      (options: t.HttpPull.StartOptions) => t.HttpPull.ResourceOperation.Instance
    >();

    const owner = await rooted();
    const operation = start([], owner, resourcePolicy([], { maxResources: 0 }));
    expectTypeOf(operation.done).toEqualTypeOf<Promise<t.HttpPull.Result>>();
    const checksum = {
      expected: Hash.sha256('expected'),
    } as t.HttpPull.ResourceChecksumEvidence;
    expectTypeOf(checksum).toEqualTypeOf<{
      readonly expected: t.StringHash;
      readonly received?: t.StringHash;
      readonly valid?: boolean;
    }>();
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
        received: resources[0].checksum,
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

  it('requires complete Rooted authority before admission or transport', async () => {
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
      const admit: t.FsRooted.Instance['Target']['admit'] = async (targets, options) => {
        const result = await owner.Target.admit(targets, options);
        admitted = true;
        return result;
      };
      const stale = Object.freeze({
        path: owner.path,
        Target: Object.freeze({ admit }),
        File: owner.File,
        Stage: owner.Stage,
      }) as unknown as t.FsRooted.Instance;

      const rejected = await start(resources, stale).done;
      expect(rejected.ok).to.eql(false);
      expect(rejected.terminal?.kind).to.eql('invalid-input');
      expect(admitted).to.eql(false);
      expect(requestBeforeAdmission).to.eql(false);

      const lifecycleOnly = Object.freeze({
        ...stale,
        Lease: owner.Lease,
      }) as unknown as t.FsRooted.Instance;
      const sealedTreeStale = await start(resources, lifecycleOnly).done;
      expect(sealedTreeStale.ok).to.eql(false);
      expect(sealedTreeStale.terminal?.kind).to.eql('invalid-input');
      expect(admitted).to.eql(false);
      expect(requestBeforeAdmission).to.eql(false);

      const destination: t.FsRooted.Instance = Object.freeze({
        ...lifecycleOnly,
        Tree: owner.Tree,
      });
      const result = await start(resources, destination).done;

      expect(result.ok).to.eql(true);
      expect(admitted).to.eql(true);
      expect(requestBeforeAdmission).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('rejects inexact or observable Rooted authority without invoking caller behavior', async () => {
    const owner = await rooted();
    const policy = resourcePolicy([], { maxResources: 0 });
    let accessorReads = 0;
    let proxyTraps = 0;
    let methodCalls = 0;

    const accessorOwner = {
      Target: owner.Target,
      Lease: owner.Lease,
      Tree: owner.Tree,
      File: owner.File,
      Stage: owner.Stage,
    };
    Object.defineProperty(accessorOwner, 'path', {
      enumerable: true,
      get() {
        accessorReads += 1;
        return owner.path;
      },
    });
    Object.freeze(accessorOwner);

    const accessorTarget = {};
    Object.defineProperty(accessorTarget, 'admit', {
      enumerable: true,
      get() {
        accessorReads += 1;
        return owner.Target.admit;
      },
    });
    Object.freeze(accessorTarget);

    const proxyHandler: ProxyHandler<object> = {
      get(target, key, receiver) {
        proxyTraps += 1;
        return Reflect.get(target, key, receiver);
      },
      getOwnPropertyDescriptor(target, key) {
        proxyTraps += 1;
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
      getPrototypeOf(target) {
        proxyTraps += 1;
        return Reflect.getPrototypeOf(target);
      },
      isExtensible(target) {
        proxyTraps += 1;
        return Reflect.isExtensible(target);
      },
      ownKeys(target) {
        proxyTraps += 1;
        return Reflect.ownKeys(target);
      },
    };
    const proxiedOwner = new Proxy(owner, proxyHandler);
    const proxiedTarget = new Proxy(owner.Target, proxyHandler);
    const proxiedAdmit = new Proxy(owner.Target.admit, {
      apply(target, receiver, args) {
        methodCalls += 1;
        return Reflect.apply(target, receiver, args);
      },
    });

    const inherited = Object.assign(
      Object.create({ admit: owner.Target.admit }),
      owner,
    );
    Object.freeze(inherited);

    const candidates: readonly unknown[] = [
      Object.freeze({ ...owner, admit: owner.Target.admit }),
      Object.freeze({
        ...owner,
        Target: Object.freeze({ ...owner.Target, acquireLease: owner.Lease.acquire }),
      }),
      accessorOwner,
      Object.freeze({ ...owner, Target: accessorTarget }),
      proxiedOwner,
      Object.freeze({ ...owner, Target: proxiedTarget }),
      Object.freeze({ ...owner, Target: Object.freeze({ admit: proxiedAdmit }) }),
      inherited,
    ];

    for (const candidate of candidates) {
      const preparation = prepareStart({ resources: [], rooted: candidate, policy });
      expect(preparation.ok).to.eql(false);
      if (!preparation.ok) expect(preparation.failure.kind).to.eql('invalid-input');
    }
    expect(accessorReads).to.eql(0);
    expect(proxyTraps).to.eql(0);
    expect(methodCalls).to.eql(0);
  });

  it('snapshots Rooted methods as frozen receiver-independent authority', async () => {
    const owner = await rooted();
    const receivers: unknown[] = [];
    const admit: t.FsRooted.Instance['Target']['admit'] = function <
      K extends t.FsRooted.TargetKind,
    >(
      this: unknown,
      targets: readonly t.FsRooted.TargetInput<K>[],
      options?: t.FsRooted.OperationOptions,
    ) {
      receivers.push(this);
      return owner.Target.admit(targets, options);
    };
    const publish: t.FsRooted.Instance['File']['publish'] = function (
      this: unknown,
      target,
      bytes,
      options,
    ) {
      receivers.push(this);
      return owner.File.publish(target, bytes, options);
    };
    const destination: t.FsRooted.Instance = Object.freeze({
      ...owner,
      Target: Object.freeze({ admit }),
      File: Object.freeze({ publish }),
    });
    const preparation = prepareStart({
      resources: [],
      rooted: destination,
      policy: resourcePolicy([], { maxResources: 0 }),
    });
    if (!preparation.ok) throw new Error('Expected complete Rooted authority.');

    expect(Object.keys(preparation.rooted)).to.eql([
      'path',
      'Target',
      'Lease',
      'Tree',
      'File',
      'Stage',
    ]);
    expect(Object.isFrozen(preparation.rooted)).to.eql(true);
    expect(Object.isFrozen(preparation.rooted.Target)).to.eql(true);
    expect(Object.isFrozen(preparation.rooted.File)).to.eql(true);

    const admission = await preparation.rooted.Target.admit([
      { kind: 'file', path: 'receiver-independent.txt' },
    ]);
    expect(
      await preparation.rooted.File.publish(admission.targets[0], encoder.encode('stable')),
    ).to.eql({ kind: 'published', bytes: 6 });
    expect(receivers).to.eql([undefined, undefined]);
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
      const destination: t.FsRooted.Instance = Object.freeze({
        ...owner,
        Target: Object.freeze(
          {
            ...owner.Target,
            admit: async (targets, options) => {
              admissions++;
              return await owner.Target.admit(targets, options);
            },
          } satisfies t.FsRooted.Instance['Target'],
        ),
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
      const destination: t.FsRooted.Instance = Object.freeze({
        ...owner,
        Target: Object.freeze(
          {
            ...owner.Target,
            admit: async (targets, options) => {
              admissions++;
              return await owner.Target.admit(targets, options);
            },
          } satisfies t.FsRooted.Instance['Target'],
        ),
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

      const failing: t.FsRooted.Instance = Object.freeze({
        ...owner,
        File: Object.freeze({
          ...owner.File,
          publish: () =>
            Promise.reject(rootedFailure('publish-file', 'io-failure', 'FILESYSTEM-SECRET')),
        }),
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
