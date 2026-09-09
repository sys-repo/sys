import { describe, expect, Fs, it, Rx, type t } from '../../-test.ts';
import { type Fixture, setup, teardown } from '../../-test/u.fixture.dist.ts';
import { Dist } from '../mod.ts';
import {
  DEFAULT_DEPENDENCIES,
  type GenerationDependencies,
  openWith,
} from '../u.generation/u.open.ts';
import { retentionSnapshot } from '../u.generation/u.retention.ts';

const TARGET = '@sample.foo';
const LOWER_FAILED = Object.freeze(
  {
    kind: 'failed',
    stage: 'storage',
    reason: 'filesystem-failure',
    cleanup: 'not-needed',
  } as const satisfies t.Dist.Failed,
);

describe('Dist.Generation authority', () => {
  it('snapshots caller authority before I/O and ignores later mutation', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'snapshot', 'root');
    const observed = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    const input = args(fixture, root);
    let materializeArgs: t.Dist.MaterializeArgs | undefined;
    let owner: t.Dist.Generation.Owner | undefined;

    try {
      const opening = openWith(input, {
        ...DEFAULT_DEPENDENCIES,
        async ensureDir(path) {
          observed.resolve();
          await resume.promise;
          await DEFAULT_DEPENDENCIES.ensureDir(path);
        },
        async materialize(value) {
          materializeArgs = value;
          return await DEFAULT_DEPENDENCIES.materialize(value);
        },
      });
      await observed.promise;
      input.store.root = Fs.join(fixture.storeDir, 'mutated-root');
      input.store.target = 'mutated-target';
      input.manifestUrl = 'https://mutated.example/dist.json';
      input.policy = {
        ...fixture.policy,
        manifest: {
          ...fixture.policy.manifest,
          maxBytes: fixture.policy.manifest.maxBytes + 1,
        },
      };
      resume.resolve();

      const result = await opening;
      expect(result.kind).to.eql('opened');
      if (result.kind !== 'opened') return;
      owner = result.owner;
      const canonicalRoot = await Fs.realPath(root);
      expect(result.owner.store).to.eql({
        root: canonicalRoot,
        target: TARGET,
        dir: Fs.join(canonicalRoot, TARGET),
      });
      expect(materializeArgs?.manifestUrl).to.eql(fixture.manifestUrl.replace(/#.*$/, ''));
      expect(materializeArgs?.policy).to.not.equal(input.policy);
      expect(Object.isFrozen(materializeArgs?.policy)).to.eql(true);
    } finally {
      resume.resolve();
      await owner?.release();
      await teardown(fixture);
    }
  });

  it('freezes non-lifecycle authority before observing borrowed lifecycle accessors', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'lifecycle-order-root');
    const initialMaxBytes = fixture.policy.manifest.maxBytes;
    const manifest = { ...fixture.policy.manifest };
    const policy = { ...fixture.policy, manifest };
    const source = Rx.subject<void>();
    const subscribe = source.subscribe.bind(source);
    let accessorReads = 0;
    const until: t.Observable<void> = Object.defineProperty(source, 'subscribe', {
      enumerable: true,
      get() {
        accessorReads += 1;
        manifest.maxBytes = initialMaxBytes + 1;
        return subscribe;
      },
    });
    const fake = fakeRooted(root, TARGET);
    let observedMaxBytes: t.NumberBytes | undefined;

    try {
      const result = await openWith(
        args(fixture, root, { policy, until }),
        {
          ensureDir: () => Promise.resolve(),
          realPath: fake.realPath,
          rooted: fake.rooted,
          materialize(input) {
            observedMaxBytes = input.policy.manifest.maxBytes;
            return Promise.resolve(LOWER_FAILED);
          },
        },
      );
      expect(result).to.eql({
        kind: 'failed',
        phase: 'materialization',
        generation: LOWER_FAILED,
        ownership: 'released',
      });
      expect(accessorReads).to.be.greaterThan(0);
      expect(manifest.maxBytes).to.eql(initialMaxBytes + 1);
      expect(observedMaxBytes).to.eql(initialMaxBytes);
    } finally {
      source.complete();
      await teardown(fixture);
    }
  });

  it('rejects hostile exact-input violations without invoking accessors or Proxy traps', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'hostile-root');
    let effects = 0;
    const trap = (): never => {
      effects += 1;
      throw new Error('Proxy trap invoked');
    };
    const handler: ProxyHandler<Record<PropertyKey, unknown>> = {
      apply: trap,
      construct: trap,
      defineProperty: trap,
      deleteProperty: trap,
      get: trap,
      getOwnPropertyDescriptor: trap,
      getPrototypeOf: trap,
      has: trap,
      isExtensible: trap,
      ownKeys: trap,
      preventExtensions: trap,
      set: trap,
      setPrototypeOf: trap,
    };
    const base = args(fixture, root) as unknown as Record<PropertyKey, unknown>;
    const accessor = (key: string, value: unknown) =>
      Object.defineProperty({ ...base }, key, {
        enumerable: true,
        get() {
          effects += 1;
          return value;
        },
      });
    const storeAccessor = {
      ...base,
      store: Object.defineProperty({ target: TARGET }, 'root', {
        enumerable: true,
        get() {
          effects += 1;
          return root;
        },
      }),
    };
    const policyAccessor = {
      ...base,
      policy: Object.defineProperty({ ...fixture.policy }, 'manifest', {
        enumerable: true,
        get() {
          effects += 1;
          return fixture.policy.manifest;
        },
      }),
    };
    const cyclicUntil: unknown[] = [];
    cyclicUntil.push(cyclicUntil);
    const sparseUntil = new Array(1);
    const proxy = new Proxy({}, handler);
    const proxyPrototype = Object.defineProperties(
      Object.create(proxy),
      Object.getOwnPropertyDescriptors(base),
    );
    const invalid: readonly Readonly<{ label: string; value: unknown }>[] = [
      { label: 'missing store', value: omit(base, 'store') },
      { label: 'extra key', value: { ...base, extra: true } },
      { label: 'top-level accessor', value: accessor('manifestUrl', fixture.manifestUrl) },
      { label: 'store accessor', value: storeAccessor },
      { label: 'policy accessor', value: policyAccessor },
      { label: 'top-level Proxy', value: proxy },
      { label: 'Proxy prototype', value: proxyPrototype },
      { label: 'Proxy policy', value: { ...base, policy: proxy } },
      { label: 'sparse lifecycle', value: { ...base, until: sparseUntil } },
      { label: 'cyclic lifecycle', value: { ...base, until: cyclicUntil } },
      { label: 'Proxy lifecycle', value: { ...base, until: proxy } },
    ];

    try {
      for (const test of invalid) {
        const before = effects;
        const result = await openWith(test.value, failOnIoDependencies());
        expect({ label: test.label, result }).to.eql({
          label: test.label,
          result: {
            kind: 'failed',
            phase: 'input',
            reason: 'invalid-input',
            ownership: 'not-acquired',
          },
        });
        expect({ label: test.label, effects: effects - before }).to.eql({
          label: test.label,
          effects: 0,
        });
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('settles cancellation before store work without touching I/O', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'pre-cancel-root');
    const controller = new AbortController();
    controller.abort('test.pre-cancelled');

    try {
      const result = await openWith(
        args(fixture, root, { until: controller.signal }),
        failOnIoDependencies(),
      );
      expect(result).to.eql({
        kind: 'failed',
        phase: 'input',
        reason: 'cancelled',
        ownership: 'not-acquired',
      });
      expect(await Fs.exists(root)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('confines the admitted target and refuses absolute or parent traversal before materialization', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'confined-root');
    let materializeCalls = 0;

    try {
      const result = await openWith(
        args(fixture, root, {
          store: { root, target: '../outside' },
        }),
        {
          ...DEFAULT_DEPENDENCIES,
          materialize() {
            materializeCalls += 1;
            return Promise.resolve(LOWER_FAILED);
          },
        },
      );
      expect(result).to.eql({
        kind: 'failed',
        phase: 'store',
        reason: 'filesystem-failure',
        ownership: 'not-acquired',
      });
      expect(materializeCalls).to.eql(0);
      expect(await Fs.exists(Fs.join(fixture.storeDir, 'outside'))).to.eql(false);

      const fake = fakeRooted(root, TARGET);
      const absolute = await openWith(
        args(fixture, root, {
          store: { root, target: Fs.join(root, TARGET) },
        }),
        {
          ensureDir: () => Promise.resolve(),
          realPath: fake.realPath,
          rooted: fake.rooted,
          materialize() {
            materializeCalls += 1;
            return Promise.resolve(LOWER_FAILED);
          },
        },
      );
      expect(absolute).to.eql({
        kind: 'failed',
        phase: 'store',
        reason: 'execution-failure',
        ownership: 'not-acquired',
      });
      expect(materializeCalls).to.eql(0);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects noncanonical target evidence returned by Rooted admission', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'target-evidence-root');
    const fake = fakeRooted(root, `./${TARGET}`);
    let materializeCalls = 0;

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize() {
          materializeCalls += 1;
          return Promise.resolve(LOWER_FAILED);
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'store',
        reason: 'execution-failure',
        ownership: 'not-acquired',
      });
      expect(materializeCalls).to.eql(0);
      expect(fake.releaseCalls()).to.eql(0);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects a Rooted instance bound to a different canonical root', async () => {
    const fixture = await setup();
    const selectedRoot: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'selected-root');
    const foreignRoot: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'foreign-root');
    const fake = fakeRooted(foreignRoot, TARGET);
    let materializeCalls = 0;

    try {
      const result = await openWith(args(fixture, selectedRoot), {
        ensureDir: () => Promise.resolve(),
        realPath: () => Promise.resolve(selectedRoot),
        rooted: fake.rooted,
        materialize() {
          materializeCalls += 1;
          return Promise.resolve(LOWER_FAILED);
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'store',
        reason: 'execution-failure',
        ownership: 'not-acquired',
      });
      expect(materializeCalls).to.eql(0);
      expect(fake.releaseCalls()).to.eql(0);
    } finally {
      await teardown(fixture);
    }
  });

  it('refuses opaque opening transports before Promise assimilation', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'opaque-transport-root');
    const fake = fakeRooted(root, TARGET);
    let thenReads = 0;
    let materializeCalls = 0;
    const opaque = () =>
      Object.defineProperty({}, 'then', {
        get() {
          thenReads += 1;
          throw new Error('opaque transport then getter invoked');
        },
      });
    const base: GenerationDependencies = {
      ensureDir: () => Promise.resolve(),
      realPath: fake.realPath,
      rooted: fake.rooted,
      materialize() {
        materializeCalls += 1;
        return Promise.resolve(LOWER_FAILED);
      },
    };
    const admissionInstance = Object.freeze({
      ...fake.instance,
      Target: Object.freeze({
        admit: (() => opaque()) as unknown as t.FsRooted.Instance['Target']['admit'],
      }),
    }) as t.FsRooted.Instance;
    const acquisitionInstance = Object.freeze({
      ...fake.instance,
      Lease: Object.freeze({
        acquire: (() => opaque()) as unknown as t.FsRooted.Instance['Lease']['acquire'],
      }),
    }) as t.FsRooted.Instance;
    const cases: readonly Readonly<{
      label: string;
      dependencies: GenerationDependencies;
      ownership: 'not-acquired' | 'pending';
    }>[] = [
      {
        label: 'root preparation',
        dependencies: {
          ...base,
          ensureDir: (() => opaque()) as unknown as typeof Fs.ensureDir,
        },
        ownership: 'not-acquired',
      },
      {
        label: 'root canonicalization',
        dependencies: {
          ...base,
          realPath: (() => opaque()) as unknown as typeof Fs.realPath,
        },
        ownership: 'not-acquired',
      },
      {
        label: 'Rooted binding',
        dependencies: {
          ...base,
          rooted: Object.freeze({
            ...fake.rooted,
            create: (() => opaque()) as unknown as t.FsRooted.Lib['create'],
          }),
        },
        ownership: 'not-acquired',
      },
      {
        label: 'target admission',
        dependencies: { ...base, rooted: withInstance(fake.rooted, admissionInstance) },
        ownership: 'not-acquired',
      },
      {
        label: 'lease acquisition',
        dependencies: { ...base, rooted: withInstance(fake.rooted, acquisitionInstance) },
        ownership: 'pending',
      },
    ];

    try {
      for (const test of cases) {
        const before = retentionSnapshot();
        const result = await openWith(args(fixture, root), test.dependencies);
        expect({ label: test.label, result }).to.eql({
          label: test.label,
          result: {
            kind: 'failed',
            phase: 'store',
            reason: 'execution-failure',
            ownership: test.ownership,
          },
        });
        expect({ label: test.label, retention: retentionSnapshot() }).to.eql({
          label: test.label,
          retention: {
            failedOpen: before.failedOpen + (test.ownership === 'pending' ? 1 : 0),
            returnedPending: before.returnedPending,
          },
        });
      }
      expect(thenReads).to.eql(0);
      expect(materializeCalls).to.eql(0);
      expect(fake.releaseCalls()).to.eql(0);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects accessor and callable Proxy Rooted methods without invoking their authority', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'proxied-method-root');
    const fake = fakeRooted(root, TARGET);
    let accessorReads = 0;
    let calls = 0;
    let materializeCalls = 0;
    const invoked = () => {
      calls += 1;
    };
    const createAccessor = Object.freeze(Object.defineProperty(
      { Is: fake.rooted.Is },
      'create',
      {
        enumerable: true,
        get() {
          accessorReads += 1;
          return fake.rooted.create;
        },
      },
    )) as t.FsRooted.Lib;
    const create = proxiedCallable(fake.rooted.create, invoked);
    const admit = proxiedCallable(fake.instance.Target.admit, invoked);
    const acquire = proxiedCallable(fake.instance.Lease.acquire, invoked);
    const admissionInstance = Object.freeze({
      ...fake.instance,
      Target: Object.freeze({ admit }),
    }) as t.FsRooted.Instance;
    const acquisitionInstance = Object.freeze({
      ...fake.instance,
      Lease: Object.freeze({ acquire }),
    }) as t.FsRooted.Instance;
    const base: GenerationDependencies = {
      ensureDir: () => Promise.resolve(),
      realPath: fake.realPath,
      rooted: fake.rooted,
      materialize() {
        materializeCalls += 1;
        return Promise.resolve(LOWER_FAILED);
      },
    };
    const cases: readonly Readonly<{
      label: string;
      rooted: t.FsRooted.Lib;
    }>[] = [
      { label: 'create accessor', rooted: createAccessor },
      { label: 'create Proxy', rooted: Object.freeze({ ...fake.rooted, create }) },
      { label: 'admit', rooted: withInstance(fake.rooted, admissionInstance) },
      { label: 'acquire', rooted: withInstance(fake.rooted, acquisitionInstance) },
    ];

    try {
      for (const test of cases) {
        const result = await openWith(args(fixture, root), { ...base, rooted: test.rooted });
        expect({ label: test.label, result }).to.eql({
          label: test.label,
          result: {
            kind: 'failed',
            phase: 'store',
            reason: 'execution-failure',
            ownership: 'not-acquired',
          },
        });
      }
      expect(accessorReads).to.eql(0);
      expect(calls).to.eql(0);
      expect(materializeCalls).to.eql(0);
      expect(fake.releaseCalls()).to.eql(0);
    } finally {
      await teardown(fixture);
    }
  });

  it('retains acquisition evidence without invoking a proxied release method', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'proxied-release-root');
    const fake = fakeRooted(root, TARGET);
    const before = retentionSnapshot();
    let releaseCalls = 0;
    let materializeCalls = 0;
    const release = new Proxy(() => Promise.resolve(), {
      apply(target, receiver, values) {
        releaseCalls += 1;
        return Reflect.apply(target, receiver, values);
      },
    });
    const instance = Object.freeze({
      ...fake.instance,
      Lease: Object.freeze({
        acquire(targets: readonly t.FsRooted.Target<'directory'>[]) {
          const lease = Object.freeze({
            mode: 'shared',
            targets: Object.freeze([...targets]),
            release,
            [Symbol.asyncDispose]: release,
          }) as t.FsRooted.Lease;
          return Promise.resolve(Object.freeze({ kind: 'acquired', lease }));
        },
      }),
    }) as t.FsRooted.Instance;

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: withInstance(fake.rooted, instance),
        materialize() {
          materializeCalls += 1;
          return Promise.resolve(LOWER_FAILED);
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'store',
        reason: 'execution-failure',
        ownership: 'pending',
      });
      expect(releaseCalls).to.eql(0);
      expect(materializeCalls).to.eql(0);
      expect(retentionSnapshot()).to.eql({
        failedOpen: before.failedOpen + 1,
        returnedPending: before.returnedPending,
      });
    } finally {
      await teardown(fixture);
    }
  });

  it('threads one signal through ordered root, target, lease, and materialization boundaries', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'ordered-root');
    const events: string[] = [];
    let createOptions: t.FsRooted.CreateOptions | undefined;
    let targetInputs: readonly t.FsRooted.TargetInput[] | undefined;
    let targetOptions: t.FsRooted.OperationOptions | undefined;
    let leaseTargets: readonly t.FsRooted.Target<'directory'>[] | undefined;
    let leaseOptions: t.FsRooted.LeaseOptions | undefined;
    let materializeUntil: t.UntilInput | undefined;
    const fake = fakeRooted(root, TARGET, {
      beforeAdmit(inputs, options) {
        events.push('admit-target');
        targetInputs = inputs;
        targetOptions = options;
      },
      beforeAcquire(targets, options) {
        events.push('acquire');
        leaseTargets = targets;
        leaseOptions = options;
      },
    });

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir() {
          events.push('prepare-root');
          return Promise.resolve();
        },
        async realPath(path) {
          events.push('canonicalize-root');
          return await fake.realPath(path);
        },
        rooted: withCreateEvent(fake.rooted, (options) => {
          events.push('bind-root');
          createOptions = options;
        }),
        materialize(input) {
          events.push('materialize');
          materializeUntil = input.until;
          return Promise.resolve(LOWER_FAILED);
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'materialization',
        generation: LOWER_FAILED,
        ownership: 'released',
      });
      expect(result.kind === 'failed' && result.generation).to.equal(LOWER_FAILED);
      expect(events).to.eql([
        'prepare-root',
        'canonicalize-root',
        'bind-root',
        'admit-target',
        'acquire',
        'materialize',
      ]);

      if (!createOptions || !targetInputs || !targetOptions || !leaseTargets || !leaseOptions) {
        throw new Error('Expected complete Rooted invocation evidence.');
      }
      const signal = createOptions.until;
      expect(createOptions.root).to.eql(root);
      expect(createOptions.create).to.eql(false);
      expect(Reflect.ownKeys(createOptions)).to.eql(['root', 'create', 'until']);
      expect(Object.isFrozen(createOptions)).to.eql(true);
      expect(targetInputs).to.eql([{ kind: 'directory', path: TARGET }]);
      expect(targetOptions).to.eql({ until: signal });
      expect(Object.isFrozen(targetInputs)).to.eql(true);
      expect(Object.isFrozen(targetInputs[0])).to.eql(true);
      expect(Object.isFrozen(targetOptions)).to.eql(true);
      expect(leaseTargets).to.have.length(1);
      expect(leaseTargets[0].path).to.eql(TARGET);
      expect(leaseOptions).to.eql({ mode: 'shared', wait: false, until: signal });
      expect(materializeUntil).to.equal(signal);
      expect(Object.isFrozen(leaseTargets)).to.eql(true);
      expect(Object.isFrozen(leaseTargets[0])).to.eql(true);
      expect(Object.isFrozen(leaseOptions)).to.eql(true);
      expect(fake.releaseCalls()).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });

  it('returns bounded contention without invoking materialization', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'busy-root');
    const fake = fakeRooted(root, TARGET, { busy: true });
    let materializeCalls = 0;

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize() {
          materializeCalls += 1;
          return Promise.resolve(LOWER_FAILED);
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'store',
        reason: 'busy',
        ownership: 'not-acquired',
      });
      expect(materializeCalls).to.eql(0);
      expect(fake.releaseCalls()).to.eql(0);
    } finally {
      await teardown(fixture);
    }
  });

  it('reports cancellation instead of actionable contention when both arrive together', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'cancelled-busy-root');
    const controller = new AbortController();
    const fake = fakeRooted(root, TARGET, {
      busy: true,
      beforeAcquire: () => controller.abort('test.cancelled-busy'),
    });
    let materializeCalls = 0;

    try {
      const result = await openWith(args(fixture, root, { until: controller.signal }), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize() {
          materializeCalls += 1;
          return Promise.resolve(LOWER_FAILED);
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'store',
        reason: 'cancelled',
        ownership: 'not-acquired',
      });
      expect(materializeCalls).to.eql(0);
      expect(fake.releaseCalls()).to.eql(0);
    } finally {
      await teardown(fixture);
    }
  });

  it('releases salvageable ownership from a malformed acquisition settlement', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'malformed-acquisition-root');
    const fake = fakeRooted(root, TARGET, {
      acquisition: (target, lease) => Object.freeze({ kind: 'busy', target, lease }),
    });
    let materializeCalls = 0;

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize() {
          materializeCalls += 1;
          return Promise.resolve(LOWER_FAILED);
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'store',
        reason: 'execution-failure',
        ownership: 'released',
      });
      expect(materializeCalls).to.eql(0);
      expect(fake.releaseCalls()).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });

  it('captures a nested lease before rejecting a mutable envelope and retains terminal failure', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'mutable-acquisition-root');
    const before = retentionSnapshot();
    let releaseCompletion: Promise<void> | undefined;
    let envelope: { kind: 'acquired'; lease?: t.FsRooted.Lease } | undefined;
    const fake = fakeRooted(root, TARGET, {
      acquisition(_target, lease) {
        envelope = { kind: 'acquired', lease };
        return envelope;
      },
      release: () => releaseCompletion ??= Promise.reject(new Error('release failed')),
    });

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize: () => Promise.resolve(LOWER_FAILED),
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'store',
        reason: 'execution-failure',
        ownership: 'pending',
      });
      expect(fake.releaseCalls()).to.eql(1);
      expect(retentionSnapshot()).to.eql({
        failedOpen: before.failedOpen + 1,
        returnedPending: before.returnedPending,
      });

      if (envelope) envelope.lease = undefined;
      expect(fake.releaseCalls()).to.eql(1);
      expect(retentionSnapshot()).to.eql({
        failedOpen: before.failedOpen + 1,
        returnedPending: before.returnedPending,
      });
    } finally {
      await teardown(fixture);
    }
  });

  it('retains opaque ownership when malformed acquired evidence cannot be released', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'opaque-acquisition-root');
    const before = retentionSnapshot();
    const fake = fakeRooted(root, TARGET, {
      acquisition: () => Object.freeze({ kind: 'acquired' }),
    });
    let materializeCalls = 0;

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize() {
          materializeCalls += 1;
          return Promise.resolve(LOWER_FAILED);
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'store',
        reason: 'execution-failure',
        ownership: 'pending',
      });
      expect(materializeCalls).to.eql(0);
      expect(fake.releaseCalls()).to.eql(0);
      expect(retentionSnapshot()).to.eql({
        failedOpen: before.failedOpen + 1,
        returnedPending: before.returnedPending,
      });
    } finally {
      await teardown(fixture);
    }
  });

  it('cancels after acquisition with independent released ownership', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'cancel-root');
    const controller = new AbortController();
    const fake = fakeRooted(root, TARGET, {
      beforeAcquire: () => controller.abort('test.cancelled'),
    });
    let materializeCalls = 0;

    try {
      const result = await openWith(args(fixture, root, { until: controller.signal }), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize() {
          materializeCalls += 1;
          return Promise.resolve(LOWER_FAILED);
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'store',
        reason: 'cancelled',
        ownership: 'released',
      });
      expect(materializeCalls).to.eql(0);
      expect(fake.releaseCalls()).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });

  it('retains cancellation ownership for process lifetime after terminal release failure', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'cancel-pending-root');
    const controller = new AbortController();
    let releaseCompletion: Promise<void> | undefined;
    const before = retentionSnapshot();
    const fake = fakeRooted(root, TARGET, {
      beforeAcquire: () => controller.abort('test.cancelled'),
      release: () => releaseCompletion ??= Promise.reject(new Error('release failed')),
    });

    try {
      const result = await openWith(args(fixture, root, { until: controller.signal }), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize: () => Promise.resolve(LOWER_FAILED),
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'store',
        reason: 'cancelled',
        ownership: 'pending',
      });
      expect(fake.releaseCalls()).to.eql(1);
      expect(retentionSnapshot()).to.eql({
        failedOpen: before.failedOpen + 1,
        returnedPending: before.returnedPending,
      });
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves an admitted lower failure when cancellation follows its settlement', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'failed-then-cancelled-root');
    const controller = new AbortController();
    const fake = fakeRooted(root, TARGET);

    try {
      const result = await openWith(args(fixture, root, { until: controller.signal }), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize() {
          return new Promise((resolve) => {
            resolve(LOWER_FAILED);
            controller.abort('after-failed-settlement');
          });
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'materialization',
        generation: LOWER_FAILED,
        ownership: 'released',
      });
      expect(result.kind === 'failed' && result.generation).to.equal(LOWER_FAILED);
      expect(fake.releaseCalls()).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves lower failure and pending ownership when cancellation precedes release failure', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(
      fixture.storeDir,
      'failed-cancelled-pending-root',
    );
    const controller = new AbortController();
    const before = retentionSnapshot();
    let releaseCompletion: Promise<void> | undefined;
    const fake = fakeRooted(root, TARGET, {
      release: () => releaseCompletion ??= Promise.reject(new Error('release failed')),
    });

    try {
      const result = await openWith(args(fixture, root, { until: controller.signal }), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize() {
          return new Promise((resolve) => {
            resolve(LOWER_FAILED);
            controller.abort('after-failed-settlement');
          });
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'materialization',
        generation: LOWER_FAILED,
        ownership: 'pending',
      });
      expect(result.kind === 'failed' && result.generation).to.equal(LOWER_FAILED);
      expect(fake.releaseCalls()).to.eql(1);
      expect(retentionSnapshot()).to.eql({
        failedOpen: before.failedOpen + 1,
        returnedPending: before.returnedPending,
      });
    } finally {
      await teardown(fixture);
    }
  });

  it('cancels when cancellation wins before successful result admission', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(
      fixture.storeDir,
      'pre-admission-cancel-root',
    );
    const lower = await prepareSuccess(fixture, root, TARGET);
    const controller = new AbortController();
    const fake = fakeRooted(root, TARGET);

    try {
      const result = await openWith(args(fixture, root, { until: controller.signal }), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize() {
          return new Promise((resolve) => {
            resolve(lower);
            controller.abort('before-success-admission');
          });
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'materialization',
        reason: 'cancelled',
        ownership: 'released',
      });
      expect(fake.releaseCalls()).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });

  it('keeps opened ownership when cancellation arrives after successful admission', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'late-cancel-root');
    const lower = await prepareSuccess(fixture, root, TARGET);
    const controller = new AbortController();
    const fake = fakeRooted(root, TARGET);
    let owner: t.Dist.Generation.Owner | undefined;

    try {
      const result = await openWith(args(fixture, root, { until: controller.signal }), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize: () => Promise.resolve(lower),
      });
      expect(result.kind).to.eql('opened');
      if (result.kind !== 'opened') return;
      owner = result.owner;
      controller.abort('after-success-admission');
      expect(result.generation).to.equal(lower);
      expect(fake.releaseCalls()).to.eql(0);
    } finally {
      await owner?.release();
      await teardown(fixture);
    }
  });

  it('rejects frozen success evidence that is not bound to the selected generation', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'success-binding-root');
    const lower = await prepareSuccess(fixture, root, TARGET);
    const mutableAssets = { ...lower.verification.assets };
    const oversizedDist = Object.freeze(
      Array.from({ length: lower.verification.manifestBytes }, () => null),
    );
    const cyclicDist: unknown[] = [];
    cyclicDist.push(cyclicDist);
    Object.freeze(cyclicDist);
    const cases: Array<{ label: string; value: unknown }> = [
      {
        label: 'wrong directory',
        value: Object.freeze({ ...lower, dir: `${lower.dir}-forged` }),
      },
      {
        label: 'wrong configured source',
        value: Object.freeze({
          ...lower,
          source: Object.freeze({
            ...lower.source,
            configuredUrl: 'https://forged.example/dist.json',
          }),
        }),
      },
      {
        label: 'mutable nested verification evidence',
        value: Object.freeze({
          ...lower,
          verification: Object.freeze({ ...lower.verification, assets: mutableAssets }),
        }),
      },
      {
        label: 'verification graph exceeding its authenticated byte bound',
        value: Object.freeze({
          ...lower,
          verification: Object.freeze({ ...lower.verification, dist: oversizedDist }),
        }),
      },
      {
        label: 'cyclic verification graph',
        value: Object.freeze({
          ...lower,
          verification: Object.freeze({ ...lower.verification, dist: cyclicDist }),
        }),
      },
    ];
    if (lower.kind === 'promoted') {
      const requestedOrigin = new URL(lower.source.requestedUrl).origin;
      cases.push(
        {
          label: 'requested source not bound to the configured request',
          value: Object.freeze({
            ...lower,
            source: Object.freeze({
              ...lower.source,
              requestedUrl: `${requestedOrigin}/forged-dist.json`,
            }),
          }),
        },
        {
          label: 'final source outside the manifest source policy',
          value: Object.freeze({
            ...lower,
            source: Object.freeze({
              ...lower.source,
              finalUrl: 'https://attacker.example/dist.json',
            }),
          }),
        },
        {
          label: 'contradictory transfer totals',
          value: Object.freeze({
            ...lower,
            totals: Object.freeze({
              ...lower.totals,
              transferredBytes: lower.totals.transferredBytes + 1,
              publishedBytes: lower.totals.publishedBytes + 1,
            }),
          }),
        },
      );
    }

    try {
      for (const test of cases) {
        const fake = fakeRooted(root, TARGET);
        const result = await openWith(args(fixture, root), {
          ensureDir: () => Promise.resolve(),
          realPath: fake.realPath,
          rooted: fake.rooted,
          materialize: () => Promise.resolve(test.value as t.Dist.MaterializeResult),
        });
        expect({ label: test.label, result }).to.eql({
          label: test.label,
          result: {
            kind: 'failed',
            phase: 'materialization',
            reason: 'execution-failure',
            ownership: 'released',
          },
        });
        expect(fake.releaseCalls()).to.eql(1);
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('refuses malformed and proxied lower settlements, releases ownership, and leaks no cause', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'lower-hostile-root');
    let traps = 0;
    const proxied = new Proxy(Object.freeze({ kind: 'existing' }), {
      get(_target, key) {
        if (key === 'then') return undefined; // Native Promise resolution owns this one lookup.
        traps += 1;
        throw new Error('lower Proxy trap invoked');
      },
      getOwnPropertyDescriptor() {
        traps += 1;
        throw new Error('lower Proxy trap invoked');
      },
      getPrototypeOf() {
        traps += 1;
        throw new Error('lower Proxy trap invoked');
      },
      ownKeys() {
        traps += 1;
        throw new Error('lower Proxy trap invoked');
      },
    });
    let accessorReads = 0;
    const accessorFailure = Object.freeze(Object.defineProperty(
      {
        stage: 'storage',
        reason: 'filesystem-failure',
        cleanup: 'not-needed',
      },
      'kind',
      {
        enumerable: true,
        get() {
          accessorReads += 1;
          return 'failed';
        },
      },
    ));
    const symbolFailure = Object.freeze(Object.defineProperty(
      { ...LOWER_FAILED },
      Symbol('extra'),
      { enumerable: true, value: true },
    ));
    const invalidMismatch = Object.freeze({
      kind: 'failed',
      stage: 'manifest-fetch',
      reason: 'integrity-mismatch',
      cleanup: 'not-needed',
      manifestChecksum: Object.freeze({
        expected: fixture.integrity,
        received: fixture.integrity,
      }),
    });
    const raw = Object.freeze({ secret: 'lower-cause' });
    const cases: readonly Readonly<{
      label: string;
      materialize: t.Dist.Materialize;
    }>[] = [
      {
        label: 'incomplete settlement',
        materialize: () => Promise.resolve(Object.freeze({ kind: 'existing' }) as t.Dist.Existing),
      },
      {
        label: 'mutable failed settlement',
        materialize: () => Promise.resolve(({ ...LOWER_FAILED }) as t.Dist.Failed),
      },
      {
        label: 'accessor failed settlement',
        materialize: () => Promise.resolve(accessorFailure as unknown as t.Dist.Failed),
      },
      {
        label: 'extra-symbol failed settlement',
        materialize: () => Promise.resolve(symbolFailure as unknown as t.Dist.Failed),
      },
      {
        label: 'self-contradictory checksum mismatch',
        materialize: () => Promise.resolve(invalidMismatch as t.Dist.ManifestChecksumFailed),
      },
      {
        label: 'proxied settlement',
        materialize: () => Promise.resolve(proxied as t.Dist.Existing),
      },
      {
        label: 'throwing lower operation',
        materialize: () => Promise.reject(raw),
      },
    ];

    try {
      for (const test of cases) {
        const fake = fakeRooted(root, TARGET);
        const result = await openWith(args(fixture, root), {
          ensureDir: () => Promise.resolve(),
          realPath: fake.realPath,
          rooted: fake.rooted,
          materialize: test.materialize,
        });
        expect({ label: test.label, result }).to.eql({
          label: test.label,
          result: {
            kind: 'failed',
            phase: 'materialization',
            reason: 'execution-failure',
            ownership: 'released',
          },
        });
        expect(Reflect.ownKeys(result)).to.eql(['kind', 'phase', 'reason', 'ownership']);
        expect(fake.releaseCalls()).to.eql(1);
      }
      expect(traps).to.eql(0);
      expect(accessorReads).to.eql(0);
    } finally {
      await teardown(fixture);
    }
  });

  it('retains failed-open ownership for process lifetime after terminal release failure', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'failed-retention-root');
    const raw = Object.freeze({ secret: 'release-cause' });
    let releaseCompletion: Promise<void> | undefined;
    const before = retentionSnapshot();
    const fake = fakeRooted(root, TARGET, {
      release: () => releaseCompletion ??= Promise.reject(raw),
    });

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize: () => Promise.resolve(LOWER_FAILED),
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'materialization',
        generation: LOWER_FAILED,
        ownership: 'pending',
      });
      expect(fake.releaseCalls()).to.eql(1);
      expect(retentionSnapshot()).to.eql({
        failedOpen: before.failedOpen + 1,
        returnedPending: before.returnedPending,
      });
    } finally {
      await teardown(fixture);
    }
  });

  it('shares one terminal release failure without exposing the lower cause', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'returned-retention-root');
    const lower = await prepareSuccess(fixture, root, TARGET);
    const lowerRelease = Promise.withResolvers<void>();
    const raw = Object.freeze({ secret: 'release-cause' });
    const fake = fakeRooted(root, TARGET, { release: () => lowerRelease.promise });
    const before = retentionSnapshot();
    let owner: t.Dist.Generation.Owner | undefined;

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize: () => Promise.resolve(lower),
      });
      expect(result.kind).to.eql('opened');
      if (result.kind !== 'opened') return;
      owner = result.owner;

      const terminal = owner.release();
      const concurrent = owner[Symbol.asyncDispose]();
      expect(concurrent).to.equal(terminal);
      expect(fake.releaseCalls()).to.eql(1);
      expect(retentionSnapshot()).to.eql({
        failedOpen: before.failedOpen,
        returnedPending: before.returnedPending + 1,
      });

      lowerRelease.reject(raw);
      const cause = await catchCause(() => terminal);
      expect(cause).to.be.instanceOf(Error);
      expect(cause).to.not.equal(raw);
      if (!(cause instanceof Error)) throw new Error('Expected sanitized release error.');
      expect(cause.message).to.eql('Dist generation ownership release failed');
      expect(cause.cause).to.eql(undefined);

      const repeated = owner.release();
      expect(repeated).to.equal(terminal);
      expect(await catchCause(() => repeated)).to.equal(cause);
      expect(fake.releaseCalls()).to.eql(1);
      expect(retentionSnapshot()).to.eql({
        failedOpen: before.failedOpen,
        returnedPending: before.returnedPending + 1,
      });
    } finally {
      await ignoreFailure(() => owner?.release());
      await teardown(fixture);
    }
  });

  it('linearizes reentrant release behind the first in-flight operation', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'reentrant-release-root');
    const lower = await prepareSuccess(fixture, root, TARGET);
    let owner: t.Dist.Generation.Owner | undefined;
    let reentrant: Promise<void> | undefined;
    let entered = false;
    const fake = fakeRooted(root, TARGET, {
      release() {
        if (!entered) {
          entered = true;
          reentrant = owner!.release();
        }
        return Promise.resolve();
      },
    });

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize: () => Promise.resolve(lower),
      });
      expect(result.kind).to.eql('opened');
      if (result.kind !== 'opened') return;
      owner = result.owner;

      const first = owner.release();
      expect(reentrant).to.equal(first);
      expect(fake.releaseCalls()).to.eql(1);
      await first;
      expect(owner.release()).to.equal(first);
    } finally {
      await ignoreFailure(() => owner?.release());
      await teardown(fixture);
    }
  });

  it('retains a decorated native release completion without invoking its accessor', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'decorated-promise-root');
    const lower = await prepareSuccess(fixture, root, TARGET);
    const before = retentionSnapshot();
    let constructorReads = 0;
    const decorated = Object.defineProperty(Promise.resolve(), 'constructor', {
      get() {
        constructorReads += 1;
        throw new Error('constructor getter invoked');
      },
    });
    const fake = fakeRooted(root, TARGET, { release: () => decorated });
    let owner: t.Dist.Generation.Owner | undefined;

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize: () => Promise.resolve(lower),
      });
      expect(result.kind).to.eql('opened');
      if (result.kind !== 'opened') return;
      owner = result.owner;

      const terminal = owner.release();
      const cause = await catchCause(() => terminal);
      expect(cause).to.be.instanceOf(Error);
      expect(constructorReads).to.eql(0);
      expect(owner.release()).to.equal(terminal);
      expect(fake.releaseCalls()).to.eql(1);
      expect(retentionSnapshot()).to.eql({
        failedOpen: before.failedOpen,
        returnedPending: before.returnedPending + 1,
      });
    } finally {
      await ignoreFailure(() => owner?.release());
      await teardown(fixture);
    }
  });

  it('retains a thenable release completion as one terminal operation without invoking it', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'thenable-root');
    const lower = await prepareSuccess(fixture, root, TARGET);
    let thenReads = 0;
    const thenable = Object.defineProperty({}, 'then', {
      get() {
        thenReads += 1;
        throw new Error('then getter invoked');
      },
    });
    const fake = fakeRooted(root, TARGET, { release: () => thenable });
    let owner: t.Dist.Generation.Owner | undefined;

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize: () => Promise.resolve(lower),
      });
      expect(result.kind).to.eql('opened');
      if (result.kind !== 'opened') return;
      owner = result.owner;

      const terminal = owner.release();
      expect(await catchCause(() => terminal)).to.be.instanceOf(Error);
      expect(owner.release()).to.equal(terminal);
      expect(fake.releaseCalls()).to.eql(1);
      expect(thenReads).to.eql(0);
    } finally {
      await ignoreFailure(() => owner?.release());
      await teardown(fixture);
    }
  });

  it('retains a non-void release settlement as one terminal operation', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'non-void-root');
    const lower = await prepareSuccess(fixture, root, TARGET);
    const fake = fakeRooted(root, TARGET, {
      release: () => Promise.resolve('forged completion'),
    });
    let owner: t.Dist.Generation.Owner | undefined;

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize: () => Promise.resolve(lower),
      });
      expect(result.kind).to.eql('opened');
      if (result.kind !== 'opened') return;
      owner = result.owner;

      const terminal = owner.release();
      expect(await catchCause(() => terminal)).to.be.instanceOf(Error);
      expect(owner.release()).to.equal(terminal);
      expect(fake.releaseCalls()).to.eql(1);
    } finally {
      await ignoreFailure(() => owner?.release());
      await teardown(fixture);
    }
  });

  it('retains ownership behind an unobservable materialization transport without invoking it', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(
      fixture.storeDir,
      'unobservable-materialization-root',
    );
    const before = retentionSnapshot();
    let thenReads = 0;
    const operation = Object.defineProperty({}, 'then', {
      get() {
        thenReads += 1;
        throw new Error('materialization then getter invoked');
      },
    });
    const fake = fakeRooted(root, TARGET);

    try {
      const result = await openWith(args(fixture, root), {
        ensureDir: () => Promise.resolve(),
        realPath: fake.realPath,
        rooted: fake.rooted,
        materialize: (() => operation) as unknown as t.Dist.Materialize,
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'materialization',
        reason: 'execution-failure',
        ownership: 'pending',
      });
      expect(thenReads).to.eql(0);
      expect(fake.releaseCalls()).to.eql(0);
      expect(retentionSnapshot()).to.eql({
        failedOpen: before.failedOpen + 1,
        returnedPending: before.returnedPending,
      });
    } finally {
      await teardown(fixture);
    }
  });
});

type FakeRooted = {
  readonly rooted: t.FsRooted.Lib;
  readonly instance: t.FsRooted.Instance;
  readonly realPath: typeof Fs.realPath;
  readonly releaseCalls: () => number;
};

function fakeRooted(
  root: t.StringAbsoluteDir,
  path: t.StringPath,
  options: {
    readonly busy?: boolean;
    readonly beforeAdmit?: (
      inputs: readonly t.FsRooted.TargetInput[],
      options?: t.FsRooted.OperationOptions,
    ) => void;
    readonly beforeAcquire?: (
      targets: readonly t.FsRooted.Target<'directory'>[],
      options: t.FsRooted.LeaseOptions,
    ) => void;
    readonly acquisition?: (
      target: t.FsRooted.Target<'directory'>,
      lease: t.FsRooted.Lease,
    ) => unknown;
    readonly release?: () => unknown;
  } = {},
): FakeRooted {
  const target = Object.freeze({ kind: 'directory', path }) as t.FsRooted.Target<'directory'>;
  let releases = 0;
  const release = () => {
    releases += 1;
    return options.release?.() ?? Promise.resolve();
  };
  const lease = Object.freeze({
    mode: 'shared',
    targets: Object.freeze([target]),
    release,
    [Symbol.asyncDispose]: release,
  }) as t.FsRooted.Lease;
  const instance = Object.freeze({
    path: root,
    Target: Object.freeze({
      admit(
        inputs: readonly t.FsRooted.TargetInput[],
        operationOptions?: t.FsRooted.OperationOptions,
      ) {
        options.beforeAdmit?.(inputs, operationOptions);
        return Promise.resolve(Object.freeze({ targets: Object.freeze([target]) }));
      },
    }),
    Lease: Object.freeze({
      acquire(
        targets: readonly t.FsRooted.Target<'directory'>[],
        leaseOptions: t.FsRooted.LeaseOptions,
      ) {
        options.beforeAcquire?.(targets, leaseOptions);
        const result = options.acquisition?.(target, lease) ??
          (options.busy
            ? Object.freeze({ kind: 'busy', target })
            : Object.freeze({ kind: 'acquired', lease }));
        return Promise.resolve(result);
      },
    }),
    Tree: Object.freeze({}),
    File: Object.freeze({}),
    Stage: Object.freeze({}),
  }) as unknown as t.FsRooted.Instance;
  return {
    rooted: Object.freeze({
      Is: Fs.Capability.Rooted.Is,
      create: () => Promise.resolve(instance),
    }),
    instance,
    realPath: () => Promise.resolve(root),
    releaseCalls: () => releases,
  };
}

function withInstance(
  rooted: t.FsRooted.Lib,
  instance: t.FsRooted.Instance,
): t.FsRooted.Lib {
  return Object.freeze({
    ...rooted,
    create: () => Promise.resolve(instance),
  });
}

function proxiedCallable<F extends (...args: never[]) => unknown>(
  target: F,
  invoked: () => void,
): F {
  return new Proxy(target, {
    apply(target, receiver, values) {
      invoked();
      return Reflect.apply(target, receiver, values);
    },
  });
}

function withCreateEvent(
  rooted: t.FsRooted.Lib,
  event: (options: t.FsRooted.CreateOptions) => void,
): t.FsRooted.Lib {
  return Object.freeze({
    ...rooted,
    async create(options) {
      event(options);
      return await rooted.create(options);
    },
  });
}

async function prepareSuccess(
  fixture: Fixture,
  root: t.StringAbsoluteDir,
  target: t.StringPath,
): Promise<t.Dist.Existing | t.Dist.Promoted> {
  await Fs.ensureDir(root);
  const result = await Dist.materialize(fixture.args({ storeDir: Fs.join(root, target) }));
  if (result.kind === 'failed') throw new Error(`Failed to prepare generation: ${result.reason}`);
  return result;
}

function args(
  fixture: Fixture,
  root: t.StringDir,
  overrides: Partial<t.Dist.Generation.Open.Args> = {},
): t.Dist.Generation.Open.Args {
  return {
    store: { root, target: TARGET },
    manifestUrl: fixture.manifestUrl,
    integrity: fixture.integrity,
    policy: fixture.policy,
    ...overrides,
  };
}

function failOnIoDependencies(): GenerationDependencies {
  const fail = (): never => {
    throw new Error('Invalid Generation input reached I/O.');
  };
  return {
    ensureDir: fail,
    realPath: fail,
    rooted: Object.freeze({
      Is: Fs.Capability.Rooted.Is,
      create: fail,
    }),
    materialize: fail,
  };
}

function omit(input: Record<PropertyKey, unknown>, key: PropertyKey): Record<PropertyKey, unknown> {
  const output = { ...input };
  Reflect.deleteProperty(output, key);
  return output;
}

async function catchCause(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
  } catch (cause) {
    return cause;
  }
  throw new Error('Expected operation to reject.');
}

async function ignoreFailure(operation: () => Promise<unknown> | undefined): Promise<void> {
  try {
    await operation();
  } catch {
    // Best-effort fixture cleanup must preserve the primary assertion settlement.
  }
}
