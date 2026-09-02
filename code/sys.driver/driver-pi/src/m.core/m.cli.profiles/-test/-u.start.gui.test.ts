import {
  BootstrapStatus as BootstrapStatusHost,
  describe,
  DistServer,
  expect,
  it,
  type TBootstrapStatus as BootstrapStatus,
  WebFixture,
} from '../../../-test.ts';
import { type Cli, Fs, Json, type t } from '../common.ts';
import { snapshotAuthorityEvidence } from '../u.start/u.authority.ts';
import { VERIFIED_LOOPBACK_BROWSER_POLICY } from '../u.start/u.browser.ts';
import { snapshotApplicationOwner, snapshotEvidence } from '../u.start/u.identity.ts';
import { snapshotStatusOwner } from '../u.start/u.lifecycle.ts';
import { AUTHORITY_LIMITS } from '../u.start/u.limits.ts';
import { resolveIntegrity, resolveManifestSource } from '../u.start/u.source.ts';
import { captureUrl, stableNativeUrl } from '../u.start/u.url.ts';
import {
  start as startRuntime,
  type StartGuiDependencies,
  type StartGuiInput,
} from '../u.start/u.gui.ts';
import { startGuiCompletionKind } from '../u/u.start.gui.settlement.ts';
import { START_GUI_SERVICE, type StartGuiEvidence } from '../u/u.start.gui.service.ts';
import {
  asProfileRoot,
  bootstrapStatusFixture,
  deferred,
  fakeGeneration,
  fakeGenerationWithPkgEvidence,
  type Keyboard,
  loopbackDistFixture,
  rejectionOf,
  removeDistStore,
  startedFixture,
} from './u.fixture.start.gui.ts';

const APPLICATION_EXPECTATION = Object.freeze({
  integrity: START_GUI_SERVICE.source.integrity,
  expectedPkg: START_GUI_SERVICE.source.expectedPkg,
});

const start = async (input: StartGuiInput): ReturnType<typeof startRuntime> => {
  const automatic = automaticSession(input.until === undefined);
  const selectedRoot = input.cwd.root;
  if (!selectedRoot) throw new Error('Expected test runtime root.');
  const root = await Fs.realPath(selectedRoot) as t.StringDir;
  const overrides = input.deps ?? {};
  const createScreen = overrides.createScreen;
  return await startRuntime({
    ...input,
    cwd: asProfileRoot(root),
    deps: {
      ...automatic,
      ...overrides,
      ...(createScreen
        ? {
          createScreen: (screenInput) => {
            const selected = createScreen(screenInput);
            if (selected.kind === 'unavailable') return selected;
            let observer: ReturnType<StartGuiDependencies['createScreen']>;
            try {
              observer = automatic.createScreen(screenInput);
            } catch (cause) {
              selected.dispose();
              throw cause;
            }
            return {
              kind: selected.kind,
              failure: selected.failure,
              redraw: () => selected.redraw(),
              warnOpen: () => selected.warnOpen(),
              dispose() {
                let failure: unknown;
                try {
                  selected.dispose();
                } catch (cause) {
                  failure = cause;
                }
                try {
                  observer.dispose();
                } catch (cause) {
                  failure ??= cause;
                }
                if (failure !== undefined) throw failure;
              },
            };
          },
        }
        : {}),
    },
  });
};

describe(`@sys/driver-pi/cli/Profiles/u.start.gui`, () => {
  it('snapshots dependency overrides without invoking accessors or Proxy traps', async () => {
    let accessorReads = 0;
    let ambientDescriptorCalls = 0;
    let containerTraps = 0;
    let functionCalls = 0;
    let functionTraps = 0;
    const accessorDependencies = Object.defineProperty({}, 'startStatus', {
      configurable: true,
      enumerable: true,
      get() {
        accessorReads += 1;
        throw new Error('dependency accessor invoked');
      },
    }) as Partial<StartGuiDependencies>;
    const originalDescriptor = Object.getOwnPropertyDescriptor;
    let accessorRun: ReturnType<typeof startRuntime>;
    {
      using _mock = WebFixture.Property.mock([{
        target: Object,
        key: 'getOwnPropertyDescriptor',
        descriptor: {
          configurable: true,
          value: (...args: Parameters<typeof Object.getOwnPropertyDescriptor>) => {
            ambientDescriptorCalls += 1;
            return Reflect.apply(originalDescriptor, Object, args);
          },
        },
      }]);
      accessorRun = startRuntime({
        cwd: asProfileRoot('/tmp/driver-pi.dependencies' as t.StringDir),
        deps: accessorDependencies,
      });
    }
    const accessorError = await rejectionOf(() => accessorRun);
    expect(accessorError.message).to.eql('start:gui dependencies invalid.');

    const containerTrap = (..._args: unknown[]): never => {
      containerTraps += 1;
      throw new Error('dependency container Proxy trap invoked');
    };
    const containerDependencies = new Proxy({}, {
      defineProperty: containerTrap,
      deleteProperty: containerTrap,
      get: containerTrap,
      getOwnPropertyDescriptor: containerTrap,
      getPrototypeOf: containerTrap,
      has: containerTrap,
      isExtensible: containerTrap,
      ownKeys: containerTrap,
      preventExtensions: containerTrap,
      set: containerTrap,
      setPrototypeOf: containerTrap,
    }) as Partial<StartGuiDependencies>;

    const functionTarget: StartGuiDependencies['startStatus'] = () => {
      functionCalls += 1;
      throw new Error('proxied dependency invoked');
    };
    const functionTrap = (..._args: unknown[]): never => {
      functionTraps += 1;
      throw new Error('dependency function Proxy trap invoked');
    };
    const functionDependency = new Proxy<StartGuiDependencies['startStatus']>(functionTarget, {
      apply: functionTrap,
      construct: functionTrap,
      defineProperty: functionTrap,
      deleteProperty: functionTrap,
      get: functionTrap,
      getOwnPropertyDescriptor: functionTrap,
      getPrototypeOf: functionTrap,
      has: functionTrap,
      isExtensible: functionTrap,
      ownKeys: functionTrap,
      preventExtensions: functionTrap,
      set: functionTrap,
      setPrototypeOf: functionTrap,
    });

    const customPrototype = Object.assign(Object.create({ authority: 'inherited' }), {
      startStatus: functionTarget,
    }) as Partial<StartGuiDependencies>;
    const nullPrototype = Object.assign(Object.create(null), {
      startStatus: functionTarget,
    }) as Partial<StartGuiDependencies>;
    const hiddenResidue = Object.defineProperty(
      { startStatus: functionTarget },
      'extraAuthority',
      { value: true },
    ) as Partial<StartGuiDependencies>;
    const symbolResidue = {
      startStatus: functionTarget,
      [Symbol('extra-authority')]: true,
    } as Partial<StartGuiDependencies>;
    const cases: ReadonlyArray<{
      label: string;
      deps: Partial<StartGuiDependencies>;
    }> = [
      {
        label: 'null container',
        deps: null as unknown as Partial<StartGuiDependencies>,
      },
      { label: 'Proxy container', deps: containerDependencies },
      { label: 'Proxy function', deps: { startStatus: functionDependency } },
      { label: 'custom prototype', deps: customPrototype },
      { label: 'null prototype', deps: nullPrototype },
      {
        label: 'unknown enumerable key',
        deps: {
          startStatus: functionTarget,
          extraAuthority: true,
        } as unknown as Partial<StartGuiDependencies>,
      },
      { label: 'unknown non-enumerable key', deps: hiddenResidue },
      { label: 'unknown symbol key', deps: symbolResidue },
      {
        label: 'explicit undefined',
        deps: { startStatus: undefined } as unknown as Partial<StartGuiDependencies>,
      },
      {
        label: 'explicit null',
        deps: { startStatus: null } as unknown as Partial<StartGuiDependencies>,
      },
    ];
    for (const fixture of cases) {
      const error = await rejectionOf(() =>
        startRuntime({
          cwd: asProfileRoot('/tmp/driver-pi.dependencies' as t.StringDir),
          deps: fixture.deps,
        })
      );
      expect({ label: fixture.label, message: error.message }).to.eql({
        label: fixture.label,
        message: 'start:gui dependencies invalid.',
      });
    }

    expect({
      accessorReads,
      ambientDescriptorCalls,
      containerTraps,
      functionCalls,
      functionTraps,
    }).to.eql({
      accessorReads: 0,
      ambientDescriptorCalls: 0,
      containerTraps: 0,
      functionCalls: 0,
      functionTraps: 0,
    });
  });

  it('admits only direct native cancellation signals without structural observation', async () => {
    let proxyTraps = 0;
    let accessorReads = 0;
    let statusCalls = 0;
    const trap = (..._args: unknown[]): never => {
      proxyTraps += 1;
      throw new Error('cancellation Proxy trap invoked');
    };
    const proxySignal = new Proxy({}, {
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
    });
    const structuralSignal = Object.defineProperties({}, {
      aborted: {
        enumerable: true,
        get() {
          accessorReads += 1;
          return false;
        },
      },
      addEventListener: {
        enumerable: true,
        get() {
          accessorReads += 1;
          return () => undefined;
        },
      },
      removeEventListener: {
        enumerable: true,
        get() {
          accessorReads += 1;
          return () => undefined;
        },
      },
    });
    const shadowedSignal = new AbortController().signal;
    Object.defineProperty(shadowedSignal, 'aborted', {
      configurable: true,
      get() {
        accessorReads += 1;
        return false;
      },
    });
    const cases = [proxySignal, structuralSignal, shadowedSignal, null, []] as const;

    for (const until of cases) {
      const error = await rejectionOf(() =>
        startRuntime({
          cwd: asProfileRoot('/tmp/driver-pi.cancellation-input' as t.StringDir),
          until: until as unknown as AbortSignal,
          deps: {
            startStatus: () => {
              statusCalls += 1;
              throw new Error('bootstrap must not start');
            },
          },
        })
      );
      expect(error.message).to.eql('start:gui input invalid.');
    }

    expect({ proxyTraps, accessorReads, statusCalls }).to.eql({
      proxyTraps: 0,
      accessorReads: 0,
      statusCalls: 0,
    });
  });

  it('invokes every copied dependency without a container receiver', async () => {
    const cwd = (await Fs.makeTempDir({
      prefix: 'driver-pi.profiles.u.start.gui.receivers.',
    })).absolute as t.StringDir;
    const root = await Fs.realPath(cwd) as t.StringDir;
    const session = automaticSession(true);
    const receivers: Partial<Record<keyof StartGuiDependencies, unknown>> = {};
    const record = (key: keyof StartGuiDependencies, receiver: unknown) => {
      receivers[key] = receiver;
    };
    const deps: StartGuiDependencies = {
      materialize: function (this: unknown) {
        record('materialize', this);
        return Promise.resolve(fakeGeneration());
      },
      start: function (this: unknown, args) {
        record('start', this);
        return Promise.resolve(startedFixture({ integrity: args.integrity }));
      },
      startStatus: function <K extends string>(
        this: unknown,
        input: BootstrapStatus.StartOptions<K>,
      ) {
        record('startStatus', this);
        return session.startStatus(input);
      },
      ensureDir: function (this: unknown, ...args) {
        record('ensureDir', this);
        return Reflect.apply(Fs.ensureDir, undefined, args);
      },
      createRooted: function (this: unknown, ...args) {
        record('createRooted', this);
        return Reflect.apply(Fs.Capability.Rooted.create, undefined, args);
      },
      open: function (this: unknown) {
        record('open', this);
      },
      bindKeyboard: function (this: unknown, input) {
        record('bindKeyboard', this);
        return session.bindKeyboard(input);
      },
      createScreen: function (this: unknown, input) {
        record('createScreen', this);
        return session.createScreen(input);
      },
    };

    try {
      await startRuntime({ cwd: asProfileRoot(root), deps });
      const keys = Reflect.ownKeys(deps) as (keyof StartGuiDependencies)[];
      for (const key of keys) expect(receivers[key], key).to.eql(undefined);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('refuses a poisoned Promise substrate before bootstrap or unsafe work starts', async () => {
    let speciesReads = 0;
    let statusStarts = 0;
    let materializeCalls = 0;
    let applicationStarts = 0;
    let run: ReturnType<typeof startRuntime>;
    {
      using _mock = WebFixture.Property.mock([{
        target: Promise,
        key: Symbol.species,
        descriptor: {
          configurable: true,
          get() {
            speciesReads += 1;
            throw new Error('Promise species accessor invoked');
          },
        },
      }]);

      run = startRuntime({
        cwd: asProfileRoot('/tmp/driver-pi.promise-substrate' as t.StringDir),
        deps: {
          startStatus: () => {
            statusStarts += 1;
            throw new Error('bootstrap must not start');
          },
          materialize: () => {
            materializeCalls += 1;
            return Promise.resolve(fakeGeneration());
          },
          start: () => {
            applicationStarts += 1;
            return Promise.resolve(startedFixture());
          },
        },
      });
    }

    const error = await rejectionOf(() => run);
    expect(error.message).to.eql('start:gui Promise transport unavailable.');
    expect(speciesReads).to.eql(0);
    expect(statusStarts).to.eql(0);
    expect(materializeCalls).to.eql(0);
    expect(applicationStarts).to.eql(0);
  });

  it('refuses poisoned inherited Promise construction before bootstrap starts', async () => {
    let constructorReads = 0;
    let statusStarts = 0;
    let run: ReturnType<typeof startRuntime>;
    {
      using _mock = WebFixture.Property.mock([{
        target: Promise.prototype,
        key: 'constructor',
        descriptor: {
          configurable: true,
          get() {
            constructorReads += 1;
            throw new Error('inherited Promise constructor accessor invoked');
          },
        },
      }]);

      run = startRuntime({
        cwd: asProfileRoot('/tmp/driver-pi.promise-substrate' as t.StringDir),
        deps: {
          startStatus: () => {
            statusStarts += 1;
            throw new Error('bootstrap must not start');
          },
        },
      });
    }

    const error = await rejectionOf(() => run);
    expect(error.message).to.eql('start:gui Promise transport unavailable.');
    expect(constructorReads).to.eql(0);
    expect(statusStarts).to.eql(0);
  });

  it('refuses constructor-poisoned bootstrap transport without reading the accessor', async () => {
    const statusDone = deferred();
    let statusCloses = 0;
    const status = bootstrapStatusFixture({
      url: 'http://127.0.0.1:47000/0123456789abcdefghijklmnopqrstuvwxyzabcd' as t.StringUrl,
      finished: statusDone.promise,
      close() {
        statusCloses += 1;
        statusDone.resolve();
        return statusDone.promise;
      },
    });
    const transport = Promise.resolve(status);
    let constructorReads = 0;
    let keyboardBinds = 0;
    Object.defineProperty(transport, 'constructor', {
      configurable: true,
      get() {
        constructorReads += 1;
        throw new Error('bootstrap constructor accessor invoked');
      },
    });

    const error = await rejectionOf(() =>
      startRuntime({
        cwd: asProfileRoot('/tmp/driver-pi.bootstrap-transport' as t.StringDir),
        deps: {
          startStatus: () => transport,
          bindKeyboard: () => {
            keyboardBinds += 1;
            return undefined;
          },
        },
      })
    );
    statusDone.resolve();

    expect(error.message).to.eql('start:gui Promise transport unavailable.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'status-listener', state: 'unresolved' }],
    });
    expect({ constructorReads, keyboardBinds, statusCloses }).to.eql({
      constructorReads: 0,
      keyboardBinds: 0,
      statusCloses: 0,
    });
  });

  it('refuses ambient Promise replacement after bootstrap settlement', async () => {
    const NativePromise = Promise;
    const statusTransport = Promise.withResolvers<t.BootstrapStatus.Started>();
    const statusDone = deferred();
    let keyboardBinds = 0;
    let statusCloses = 0;
    let hostileWithResolversCalls = 0;
    const status = bootstrapStatusFixture({
      url: 'http://127.0.0.1:47000/0123456789abcdefghijklmnopqrstuvwxyzabcd' as t.StringUrl,
      finished: statusDone.promise,
      close() {
        statusCloses += 1;
        statusDone.resolve();
        return statusDone.promise;
      },
    });
    const run = startRuntime({
      cwd: asProfileRoot('/tmp/driver-pi.bootstrap-mutation' as t.StringDir),
      deps: {
        startStatus: () => statusTransport.promise,
        bindKeyboard: () => {
          keyboardBinds += 1;
          return undefined;
        },
      },
    });
    const rejected = rejectionOf(() => run);
    class HostilePromise<T> extends NativePromise<T> {}
    Object.defineProperty(HostilePromise, 'withResolvers', {
      configurable: true,
      value() {
        hostileWithResolversCalls += 1;
        throw new Error('hostile Promise.withResolvers invoked');
      },
    });

    let error: Error;
    {
      using _mock = WebFixture.Property.mock([{
        target: globalThis,
        key: 'Promise',
        descriptor: { configurable: true, value: HostilePromise, writable: true },
      }]);
      statusTransport.resolve(status);
      error = await rejected;
    }
    statusDone.resolve();

    expect(error.message).to.eql('start:gui Promise transport unavailable.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'status-listener', state: 'unresolved' }],
    });
    expect(hostileWithResolversCalls).to.eql(0);
    expect(keyboardBinds).to.eql(0);
    expect(statusCloses).to.eql(0);
  });

  it('rejects hostile status handles without invoking accessors or Proxy traps', async () => {
    for (const variant of ['accessor', 'proxy'] as const) {
      const statusDone = deferred();
      let urlReads = 0;
      let proxyTraps = 0;
      let transportThenReads = 0;
      let closeCalls = 0;
      let keyboardBinds = 0;
      const status = {
        url: 'http://127.0.0.1:47000/0123456789abcdefghijklmnopqrstuvwxyzabcd' as t.StringUrl,
        finished: statusDone.promise,
        close() {
          closeCalls += 1;
          statusDone.resolve();
          return Promise.resolve();
        },
      };
      const returned = variant === 'accessor'
        ? Object.defineProperty(status, 'url', {
          enumerable: true,
          get() {
            urlReads += 1;
            return status.url;
          },
        })
        : new Proxy(status, {
          get(target, key, receiver) {
            if (key === 'then') {
              transportThenReads += 1;
              return undefined;
            }
            proxyTraps += 1;
            return Reflect.get(target, key, receiver);
          },
          getOwnPropertyDescriptor(target, key) {
            proxyTraps += 1;
            return Reflect.getOwnPropertyDescriptor(target, key);
          },
        });

      const error = await rejectionOf(() =>
        startRuntime({
          cwd: asProfileRoot('/tmp/driver-pi.hostile-status' as t.StringDir),
          deps: {
            startStatus: () => Promise.resolve(returned as BootstrapStatus.Started),
            bindKeyboard: () => {
              keyboardBinds += 1;
              return undefined;
            },
          },
        })
      );

      expect(error.message).to.eql('start:gui bootstrap startup failed.');
      expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
        kind: 'cleanup-failed',
        issues: [{ resource: 'status-listener', state: 'unresolved' }],
      });
      expect({ urlReads, proxyTraps, keyboardBinds }).to.eql({
        urlReads: 0,
        proxyTraps: 0,
        keyboardBinds: 0,
      });
      expect(transportThenReads).to.eql(variant === 'proxy' ? 1 : 0);
      expect(closeCalls).to.eql(variant === 'accessor' ? 1 : 0);
    }
  });

  it('refuses a constructor-poisoned release-owner transport without invoking it', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.promise-owner.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const transport = Promise.resolve();
    let constructorReads = 0;
    let rootedCreates = 0;
    let materializeCalls = 0;
    Object.defineProperty(transport, 'constructor', {
      configurable: true,
      get() {
        constructorReads += 1;
        throw new Error('release-owner constructor invoked');
      },
    });

    try {
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(cwd),
          deps: {
            ensureDir: () => transport,
            createRooted: (input) => {
              rootedCreates += 1;
              return Fs.Capability.Rooted.create(input);
            },
            materialize: () => {
              materializeCalls += 1;
              return Promise.resolve(fakeGeneration());
            },
          },
        })
      );

      expect(error.message).to.eql(
        'start:gui materialization failed: storage/filesystem-failure',
      );
      expect((error as Error & { materialization?: unknown }).materialization).to.eql({
        stage: 'storage',
        reason: 'filesystem-failure',
        cleanup: 'pending',
      });
      expect(constructorReads).to.eql(0);
      expect(rootedCreates).to.eql(0);
      expect(materializeCalls).to.eql(0);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('bounds and canonicalizes retained authority strings', () => {
    const prefix = 'https://gui.example.test/';
    const exact = `${prefix}${'a'.repeat(AUTHORITY_LIMITS.manifestUrl - prefix.length)}`;
    const resolved = resolveManifestSource(exact);
    expect(resolved.href).to.eql(exact);
    expect(resolved.href.length).to.eql(AUTHORITY_LIMITS.manifestUrl);
    expect(() => resolveManifestSource(`${exact}a`)).to.throw(
      'Invalid start:gui manifest URL.',
    );
    expect(
      snapshotEvidence({
        kind: 'release',
        manifestUrl: `${exact}a`,
        integrity: START_GUI_SERVICE.source.integrity,
        expectedPkg: START_GUI_SERVICE.source.expectedPkg,
      }).manifestUrl,
    ).to.eql(undefined);
    expect(() => resolveManifestSource(`https://gui.example.test/\u001bcontrol`)).to.throw(
      'Invalid start:gui manifest URL.',
    );

    const canonicalInput = Object.freeze({
      kind: 'release' as const,
      manifestUrl: 'https://GUI.EXAMPLE.TEST:443/a/../dist.json',
      integrity: START_GUI_SERVICE.source.integrity,
      expectedPkg: START_GUI_SERVICE.source.expectedPkg,
    });
    const settled = snapshotAuthorityEvidence(canonicalInput);
    expect(settled.kind).to.eql('valid');
    if (settled.kind === 'valid' && settled.authority.kind === 'release') {
      expect(settled.authority.diagnostics.manifestUrl).to.eql(
        'https://gui.example.test/dist.json',
      );
    }

    const exactPkg = Object.freeze({
      name: 'n'.repeat(AUTHORITY_LIMITS.packageName),
      version: 'v'.repeat(AUTHORITY_LIMITS.packageVersion),
    });
    expect(snapshotEvidence({ ...canonicalInput, expectedPkg: exactPkg }).exact).to.eql(true);
    expect(
      snapshotEvidence({
        ...canonicalInput,
        expectedPkg: Object.freeze({ ...exactPkg, name: `${exactPkg.name}n` }),
      }).exact,
    ).to.eql(false);
    expect(
      snapshotEvidence({
        ...canonicalInput,
        expectedPkg: Object.freeze({ ...exactPkg, version: `${exactPkg.version}v` }),
      }).exact,
    ).to.eql(false);
    expect(
      snapshotEvidence({
        ...canonicalInput,
        expectedPkg: Object.freeze({ name: '@sample/\u001bhostile', version: '1.0.0' }),
      }).exact,
    ).to.eql(false);

    const secret = 'caller-secret-token';
    const invalid = snapshotAuthorityEvidence({
      ...canonicalInput,
      manifestUrl: `https://user:${secret}@gui.example.test/dist.json?token=${secret}`,
    });
    expect(invalid.kind).to.eql('invalid');
    expect(Reflect.ownKeys(invalid)).to.eql(['kind', 'error']);
    if (invalid.kind === 'invalid') {
      expect(invalid.error.message).to.eql('Invalid start:gui manifest URL.');
      expect(Json.stringify(invalid)).not.to.include(secret);
    }
  });

  it('uses captured string authority for URL and integrity admission', () => {
    const source = Object.freeze({
      ...START_GUI_SERVICE.source,
      manifestUrl: 'https://gui.example.test/dist.json?token=denied',
    });
    const methods = [
      'includes',
      'startsWith',
      'slice',
      'indexOf',
      'charCodeAt',
      'match',
      'toLowerCase',
    ] as const;

    for (const method of methods) {
      const descriptor = Object.getOwnPropertyDescriptor(String.prototype, method);
      if (!descriptor) throw new Error(`Expected String.prototype.${method} descriptor.`);
      let ambientCalls = 0;
      let authority: ReturnType<typeof snapshotAuthorityEvidence>;
      let integrity: t.StringHash;
      try {
        Object.defineProperty(String.prototype, method, {
          ...descriptor,
          value() {
            ambientCalls += 1;
            throw new Error(`ambient String.prototype.${method} invoked`);
          },
        });
        authority = snapshotAuthorityEvidence(source);
        integrity = resolveIntegrity(START_GUI_SERVICE.source.integrity);
      } finally {
        Object.defineProperty(String.prototype, method, descriptor);
      }

      expect({ method, ambientCalls, authority: authority.kind, integrity }).to.eql({
        method,
        ambientCalls: 0,
        authority: 'invalid',
        integrity: START_GUI_SERVICE.source.integrity,
      });
    }

    const malformedIntegrity = `sha256-${'z'.repeat(64)}`;
    const validStatusUrl =
      'http://127.0.0.1:45000/0123456789abcdefghijklmnopqrstuvwxyzabcd' as t.StringUrl;
    const invalidStatusUrl = `http://127.0.0.1:45000/!${'a'.repeat(31)}` as t.StringUrl;
    const finished = new Promise<void>(() => undefined);
    const status = (url: t.StringUrl) => ({
      url,
      finished,
      close: () => Promise.resolve(),
    });
    const regexpKeys = ['test', 'exec', Symbol.match] as const;
    for (const key of regexpKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(RegExp.prototype, key);
      if (!descriptor) throw new Error(`Expected RegExp prototype descriptor for ${String(key)}.`);
      let ambientCalls = 0;
      let malformedAccepted = false;
      let integrity: t.StringHash;
      let validStatus: ReturnType<typeof snapshotStatusOwner>;
      let invalidStatus: ReturnType<typeof snapshotStatusOwner>;
      try {
        Object.defineProperty(RegExp.prototype, key, {
          ...descriptor,
          value() {
            ambientCalls += 1;
            return [];
          },
        });
        integrity = resolveIntegrity(START_GUI_SERVICE.source.integrity);
        try {
          resolveIntegrity(malformedIntegrity);
          malformedAccepted = true;
        } catch {
          // Expected fixed-grammar rejection.
        }
        validStatus = snapshotStatusOwner(status(validStatusUrl));
        invalidStatus = snapshotStatusOwner(status(invalidStatusUrl));
      } finally {
        Object.defineProperty(RegExp.prototype, key, descriptor);
      }

      expect({
        key: String(key),
        ambientCalls,
        malformedAccepted,
        integrity,
        validStatus: validStatus.kind,
        invalidStatus: invalidStatus.kind,
      }).to.eql({
        key: String(key),
        ambientCalls: 0,
        malformedAccepted: false,
        integrity: START_GUI_SERVICE.source.integrity,
        validStatus: 'admitted',
        invalidStatus: 'invalid',
      });
    }
  });

  it('discards raw invalid authority before a delayed bootstrap boundary', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.authority-retention.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const secret = 'caller-retention-secret';
    const source = {
      ...START_GUI_SERVICE.source,
      manifestUrl: `https://user:${secret}@gui.example.test/dist.json?token=${secret}`,
    };
    const statusTransport = Promise.withResolvers<BootstrapStatus.Started>();
    const statusStarted = deferred();
    const statusFinished = deferred();
    const session = automaticSession(true);
    let statusInput: BootstrapStatus.StartOptions<string> | undefined;
    const status = bootstrapStatusFixture({
      url: 'http://127.0.0.1:49152/0123456789abcdefghijklmnopqrstuvwxyzabcd' as t.StringUrl,
      finished: statusFinished.promise,
      close() {
        statusFinished.resolve();
        return statusFinished.promise;
      },
    });

    try {
      const run = start({
        cwd: asProfileRoot(cwd),
        source,
        deps: {
          ...session,
          startStatus: (input) => {
            statusInput = input;
            statusStarted.resolve();
            return statusTransport.promise;
          },
          open: () => undefined,
        },
      });

      await statusStarted.promise;
      if (!statusInput) throw new Error('Expected bootstrap input.');
      expect(containsText(statusInput, secret)).to.eql(false);
      expect(Json.stringify(statusInput)).not.to.include(secret);

      source.manifestUrl = START_GUI_SERVICE.source.manifestUrl;
      statusTransport.resolve(status);
      const error = await rejectionOf(() => run);
      expect(error.message).to.eql('Invalid start:gui manifest URL.');
      expect(Json.stringify(error)).not.to.include(secret);
    } finally {
      statusFinished.resolve();
      await Fs.remove(cwd);
    }
  });

  it('uses captured reflection while admitting authority and hosted identity', () => {
    const canonicalInput = Object.freeze({
      kind: 'release' as const,
      manifestUrl: START_GUI_SERVICE.source.manifestUrl,
      integrity: START_GUI_SERVICE.source.integrity,
      expectedPkg: START_GUI_SERVICE.source.expectedPkg,
    });
    const started = startedFixture();
    const invalidExpectedPkg = Object.freeze({ name: '@sys/invalid' });
    const originalApply = Reflect.apply;
    const originalDefine = Object.defineProperty;
    const originalDescriptor = Object.getOwnPropertyDescriptor;
    const originalFreeze = Object.freeze;
    const originalFrozen = Object.isFrozen;
    const originalOwnKeys = Reflect.ownKeys;
    const originalPrototype = Object.getPrototypeOf;
    const attacks = [
      { target: Object, key: 'defineProperty', value: originalDefine },
      {
        target: Object,
        key: 'getOwnPropertyDescriptor',
        value: (...args: Parameters<typeof Object.getOwnPropertyDescriptor>) =>
          originalDescriptor(...args),
      },
      { target: Object, key: 'freeze', value: originalFreeze },
      { target: Object, key: 'isFrozen', value: originalFrozen },
      { target: Reflect, key: 'apply', value: originalApply },
      { target: Reflect, key: 'ownKeys', value: originalOwnKeys },
      { target: Object, key: 'getPrototypeOf', value: originalPrototype },
    ] as const;

    for (const attack of attacks) {
      let ambientCalls = 0;
      let authorityKind: string | undefined;
      let applicationKind: string | undefined;
      let invalidKind: string | undefined;
      {
        using _mock = WebFixture.Property.mock([{
          target: attack.target,
          key: attack.key,
          descriptor: {
            configurable: true,
            value: (...args: unknown[]) => {
              ambientCalls += 1;
              return originalApply(attack.value, attack.target, args);
            },
          },
        }]);
        authorityKind = snapshotAuthorityEvidence(canonicalInput).kind;
        invalidKind = snapshotAuthorityEvidence({
          ...canonicalInput,
          expectedPkg: invalidExpectedPkg,
        }).kind;
        applicationKind = snapshotApplicationOwner(started, APPLICATION_EXPECTATION).kind;
      }
      expect({ key: attack.key, ambientCalls, authorityKind, applicationKind, invalidKind }).to.eql(
        {
          key: attack.key,
          ambientCalls: 0,
          authorityKind: 'valid',
          applicationKind: 'admitted',
          invalidKind: 'invalid',
        },
      );
    }

    let getterCalls = 0;
    const accessorSource = Object.defineProperty(
      {
        manifestUrl: START_GUI_SERVICE.source.manifestUrl,
        integrity: START_GUI_SERVICE.source.integrity,
        expectedPkg: START_GUI_SERVICE.source.expectedPkg,
      },
      'kind',
      {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'release';
        },
      },
    );
    expect(snapshotAuthorityEvidence(accessorSource).kind).to.eql('invalid');
    expect(getterCalls).to.eql(0);
  });

  it('uses captured URL construction and getters at every admitted URL boundary', () => {
    const NativeURL = URL;
    const globalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'URL');
    if (!globalDescriptor) throw new Error('Expected global URL descriptor.');
    const canonicalInput = Object.freeze({
      kind: 'release' as const,
      manifestUrl: START_GUI_SERVICE.source.manifestUrl,
      integrity: START_GUI_SERVICE.source.integrity,
      expectedPkg: START_GUI_SERVICE.source.expectedPkg,
    });
    const started = startedFixture();
    const status = bootstrapStatusFixture();
    let globalCalls = 0;

    {
      using _mock = WebFixture.Property.mock([{
        target: globalThis,
        key: 'URL',
        descriptor: {
          ...globalDescriptor,
          value: class {
            constructor() {
              globalCalls += 1;
              throw new Error('ambient URL invoked');
            }
          },
        },
      }]);
      expect(snapshotAuthorityEvidence(canonicalInput).kind).to.eql('valid');
      expect(snapshotApplicationOwner(started, APPLICATION_EXPECTATION).kind).to.eql('admitted');
      expect(snapshotStatusOwner(status).kind).to.eql('admitted');
      expect(captureUrl(START_GUI_SERVICE.source.manifestUrl)?.href).to.eql(
        START_GUI_SERVICE.source.manifestUrl,
      );
      expect(stableNativeUrl(START_GUI_SERVICE.source.manifestUrl)?.href).to.eql(
        START_GUI_SERVICE.source.manifestUrl,
      );
    }
    expect(globalCalls).to.eql(0);

    const getterKeys = [
      'href',
      'origin',
      'protocol',
      'hostname',
      'host',
      'port',
      'username',
      'password',
      'pathname',
      'search',
      'hash',
    ] as const;
    for (const key of getterKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(NativeURL.prototype, key);
      if (!descriptor?.get) throw new Error(`Expected URL.prototype.${key} getter.`);
      let getterCalls = 0;
      const application = startedFixture();
      const statusOwner = bootstrapStatusFixture();
      {
        using _mock = WebFixture.Property.mock([{
          target: NativeURL.prototype,
          key,
          descriptor: {
            ...descriptor,
            get() {
              getterCalls += 1;
              throw new Error(`ambient URL.prototype.${key} invoked`);
            },
          },
        }]);
        const authorityKind = snapshotAuthorityEvidence(canonicalInput).kind;
        const applicationKind = snapshotApplicationOwner(
          application,
          APPLICATION_EXPECTATION,
        ).kind;
        const statusKind = snapshotStatusOwner(statusOwner).kind;
        const capturedHref = captureUrl(START_GUI_SERVICE.source.manifestUrl)?.href;
        const stableHref = stableNativeUrl(START_GUI_SERVICE.source.manifestUrl)?.href;
        expect({ key, authorityKind }).to.eql({ key, authorityKind: 'invalid' });
        expect({ key, applicationKind }).to.eql({ key, applicationKind: 'invalid' });
        expect({ key, statusKind }).to.eql({ key, statusKind: 'invalid' });
        expect({ key, capturedHref }).to.eql({ key, capturedHref: undefined });
        expect({ key, stableHref }).to.eql({ key, stableHref: undefined });
      }
      expect({ key, getterCalls }).to.eql({ key, getterCalls: 0 });
    }
  });

  it('preserves materialization failure evidence without starting an application listener', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const root = await Fs.realPath(cwd) as t.StringDir;
    const storeDir = Fs.join(root, '.pi/@sys/dist/@sys.driver-pi') as t.StringDir;
    let openCalls = 0;
    let serverCalls = 0;
    const materializationFailure = {
      kind: 'failed',
      stage: 'manifest-fetch',
      reason: 'resource-failure',
      cleanup: 'not-needed',
    } as const;

    try {
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(cwd),
          deps: {
            materialize: () => Promise.resolve(materializationFailure),
            start: () => {
              serverCalls += 1;
              return Promise.resolve(startedFixture());
            },
            open: () => {
              openCalls += 1;
            },
          },
        })
      );

      expect(error.message).to.eql(
        'start:gui materialization failed: manifest-fetch/resource-failure',
      );
      const evidence = (error as Error & { materialization?: unknown }).materialization;
      expect(evidence).to.eql({
        stage: 'manifest-fetch',
        reason: 'resource-failure',
        cleanup: 'not-needed',
      });
      expect(Object.isFrozen(materializationFailure)).to.eql(false);
      expect(Object.isFrozen(evidence)).to.eql(true);
      expect(await Fs.exists(storeDir)).to.eql(false);
      expect(await Fs.exists(Fs.dirname(storeDir))).to.eql(true);
      expect(serverCalls).to.eql(0);
      expect(openCalls).to.eql(1);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('passes pinned materialization and loopback-host authority with one stable store root', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const root = await Fs.realPath(cwd) as t.StringDir;
    const storeDir = Fs.join(root, '.pi/@sys/dist/@sys.driver-pi') as t.StringDir;
    let materializeArgs: t.Dist.MaterializeArgs | undefined;
    let startArgs: t.DistServer.Start.Args | undefined;
    let screenInput: Parameters<StartGuiDependencies['createScreen']>[0] | undefined;
    let screenDisposeCalls = 0;
    let openCalls = 0;
    let closeCalls = 0;

    try {
      await start({
        cwd: asProfileRoot(cwd),
        deps: {
          materialize: (args) => {
            materializeArgs = args;
            return Promise.resolve(fakeGeneration());
          },
          start: (args) => {
            startArgs = args;
            return Promise.resolve(startedFixture({
              close: () => {
                closeCalls += 1;
                return Promise.resolve();
              },
            }));
          },
          open: () => {
            openCalls += 1;
          },
          createScreen: (input) => {
            screenInput = input;
            return {
              kind: 'acquired',
              failure: new Promise<never>(() => {}),
              redraw() {},
              warnOpen() {},
              dispose() {
                screenDisposeCalls += 1;
              },
            };
          },
        },
      });

      expect(Object.isFrozen(START_GUI_SERVICE)).to.eql(true);
      expect(Object.isFrozen(START_GUI_SERVICE.source)).to.eql(true);
      expect(Object.isFrozen(START_GUI_SERVICE.source.expectedPkg)).to.eql(true);
      expect(START_GUI_SERVICE.name).to.eql('sys.ui:pi');
      expect(materializeArgs?.manifestUrl).to.eql(START_GUI_SERVICE.source.manifestUrl);
      expect(materializeArgs?.integrity).to.eql(START_GUI_SERVICE.source.integrity);
      expect(materializeArgs?.storeDir).to.eql(storeDir);
      expect(materializeArgs?.policy.manifest.sourceOrigins).to.eql(['http://localhost:8080']);
      expect(startArgs).to.include({
        dir: '/tmp/driver-pi-gui-generation',
        integrity: START_GUI_SERVICE.source.integrity,
        hostname: '127.0.0.1',
        port: 0,
        silent: true,
      });
      expect(Object.isFrozen(startArgs?.limits)).to.eql(true);
      expect(startArgs?.limits).to.eql({
        manifestBytes: 16 * 1024 * 1024,
        entries: 4096 * 2 + 1,
        fileBytes: 128 * 1024 * 1024,
        totalBytes: 1024 * 1024 * 1024,
      });
      expect(startArgs?.browserPolicy).to.equal(VERIFIED_LOOPBACK_BROWSER_POLICY);
      expect(startArgs?.browserPolicy).to.eql({
        kind: 'verified-loopback',
        dedicatedWorkers: [],
        serviceWorker: { kind: 'tombstone', path: 'sw.js' },
      });
      expect(Object.isFrozen(VERIFIED_LOOPBACK_BROWSER_POLICY)).to.eql(true);
      expect(Object.isFrozen(VERIFIED_LOOPBACK_BROWSER_POLICY.dedicatedWorkers)).to.eql(true);
      expect(Object.isFrozen(VERIFIED_LOOPBACK_BROWSER_POLICY.serviceWorker)).to.eql(true);
      expect(await Fs.exists(storeDir)).to.eql(false);
      expect(await Fs.exists(Fs.dirname(storeDir))).to.eql(true);
      expect(screenInput?.service).to.eql('sys.ui:pi');
      expect(screenInput?.url).to.eql(
        'http://127.0.0.1:49152/0123456789abcdefghijklmnopqrstuvwxyzabcd',
      );
      expect(screenInput?.keyboard).to.eql(true);
      expect(Reflect.ownKeys(screenInput?.state ?? {})).to.eql(['current', 'subscribe']);
      expect(screenInput?.state.current.kind).to.eql('stopping');
      expect(screenDisposeCalls).to.eql(1);
      expect(openCalls).to.eql(1);
      expect(closeCalls).to.eql(1);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('accepts a complete source replacement, snapshots it, and retains fixed authority', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const expectedPkg = {
      name: '@sample/driver-pi-gui' as t.StringPkgName,
      version: '1.0.0' as t.StringSemver,
    };
    const source = {
      kind: 'release' as const,
      manifestUrl: 'https://gui.example.test:8443/release/dist.json' as t.StringUrl,
      integrity:
        'sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as t.StringHash,
      expectedPkg,
    };
    let materializeArgs: t.Dist.MaterializeArgs | undefined;
    let startArgs: t.DistServer.Start.Args | undefined;

    try {
      const root = await Fs.realPath(cwd) as t.StringDir;
      const run = startRuntime({
        cwd: asProfileRoot(root),
        source,
        deps: {
          ...automaticSession(true),
          materialize: (args) => {
            materializeArgs = args;
            return Promise.resolve(fakeGeneration(
              { name: '@sample/driver-pi-gui', version: '1.0.0' },
              { integrity: args.integrity, manifestUrl: args.manifestUrl },
            ));
          },
          start: (args) => {
            startArgs = args;
            return Promise.resolve(startedFixture({
              pkg: Object.freeze({ name: '@sample/driver-pi-gui', version: '1.0.0' }),
              integrity: args.integrity,
            }));
          },
          open: () => undefined,
        },
      });
      source.manifestUrl = 'https://changed.example.test/dist.json';
      source.integrity = 'sha256-cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
      expectedPkg.name = '@changed/package';
      expectedPkg.version = '9.9.9';
      await run;

      expect(materializeArgs?.manifestUrl).to.eql(
        'https://gui.example.test:8443/release/dist.json',
      );
      expect(materializeArgs?.integrity).to.eql(
        'sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      );
      expect(materializeArgs?.policy.manifest.sourceOrigins).to.eql([
        'https://gui.example.test:8443',
      ]);
      expect(materializeArgs?.policy.verification).to.eql({
        manifestBytes: 16 * 1024 * 1024,
        entries: 4096 * 2 + 1,
        fileBytes: 128 * 1024 * 1024,
        totalBytes: 1024 * 1024 * 1024,
      });
      expect(startArgs).to.include({
        integrity: 'sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        hostname: '127.0.0.1',
        port: 0,
        silent: true,
      });
      expect(startArgs?.limits).to.eql(materializeArgs?.policy.verification);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('rejects outer input and nested cwd accessors without invoking them', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const root = await Fs.realPath(cwd) as t.StringDir;
    let getterCalls = 0;
    let proxyTraps = 0;
    let statusStarts = 0;
    const deps = {
      startStatus: () => {
        statusStarts += 1;
        throw new Error('bootstrap must not start');
      },
    };
    const outer = { cwd: asProfileRoot(root), deps } as StartGuiInput;
    Object.defineProperty(outer, 'source', {
      enumerable: true,
      get() {
        getterCalls += 1;
        throw new Error('outer source getter invoked');
      },
    });
    const nested = {
      invoked: root,
      git: root,
    } as t.PiCli.Cwd;
    Object.defineProperty(nested, 'root', {
      enumerable: true,
      get() {
        getterCalls += 1;
        throw new Error('nested cwd getter invoked');
      },
    });
    const trap = (): never => {
      proxyTraps += 1;
      throw new Error('outer input Proxy trap invoked');
    };
    const proxied = new Proxy({ cwd: asProfileRoot(root), deps }, {
      get: trap,
      getOwnPropertyDescriptor: trap,
      getPrototypeOf: trap,
      ownKeys: trap,
    }) as StartGuiInput;

    try {
      const outerError = await rejectionOf(() => startRuntime(outer));
      const nestedError = await rejectionOf(() => startRuntime({ cwd: nested, deps }));
      const proxyError = await rejectionOf(() => startRuntime(proxied));
      expect(outerError.message).to.eql('start:gui input invalid.');
      expect(nestedError.message).to.eql('start:gui input invalid.');
      expect(proxyError.message).to.eql('start:gui input invalid.');
      expect({ getterCalls, proxyTraps, statusStarts }).to.eql({
        getterCalls: 0,
        proxyTraps: 0,
        statusStarts: 0,
      });
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('refuses mismatched or malformed verified package objects before startup', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const expected = START_GUI_SERVICE.source.expectedPkg;
    let accessorCalls = 0;
    let proxyTrapCalls = 0;

    class PackageIdentity {
      readonly name = expected.name;
      readonly version = expected.version;
    }

    const arrayPkg = Object.freeze(Object.assign([], expected));
    const inheritedPkg = Object.freeze(Object.create(expected));
    const accessorPkg = Object.freeze(Object.defineProperties({}, {
      name: {
        enumerable: true,
        get() {
          accessorCalls += 1;
          throw new Error('raw-observed-name-getter');
        },
      },
      version: { enumerable: true, value: expected.version },
    }));
    const proxyPkg = new Proxy(Object.freeze({ ...expected }), {
      getOwnPropertyDescriptor() {
        proxyTrapCalls += 1;
        throw new Error('raw-observed-proxy-trap');
      },
    });
    const transparentProxyPkg = new Proxy(Object.freeze({ ...expected }), {
      getPrototypeOf(target) {
        proxyTrapCalls += 1;
        return Reflect.getPrototypeOf(target);
      },
    });
    const tagAccessorPkg = { ...expected };
    Object.defineProperty(tagAccessorPkg, Symbol.toStringTag, {
      enumerable: true,
      get() {
        accessorCalls += 1;
        throw new Error('raw-observed-to-string-tag-getter');
      },
    });
    Object.freeze(tagAccessorPkg);
    const extraDataPkg = Object.freeze({ ...expected, channel: 'hostile-extra' });
    const mutableNestedPkg = Object.freeze({ ...expected, metadata: { mutable: true } });
    const cases: Array<{
      label: string;
      generation: () => t.Dist.Existing;
      leak?: string;
    }> = [
      {
        label: 'name mismatch',
        generation: () => fakeGeneration({ name: '@other/driver-pi', version: expected.version }),
      },
      {
        label: 'version mismatch',
        generation: () => fakeGeneration({ name: expected.name, version: '9.9.9' }),
      },
      {
        label: 'missing package evidence',
        generation: () => fakeGenerationWithPkgEvidence({ pkg: undefined, omitPkg: true }),
      },
      {
        label: 'partial package evidence',
        generation: () =>
          fakeGenerationWithPkgEvidence({
            pkg: Object.freeze({ name: 'raw-package-metadata-must-not-leak' }),
          }),
        leak: 'raw-package-metadata-must-not-leak',
      },
      {
        label: 'array package evidence',
        generation: () => fakeGenerationWithPkgEvidence({ pkg: arrayPkg }),
      },
      {
        label: 'class package evidence',
        generation: () =>
          fakeGenerationWithPkgEvidence({ pkg: Object.freeze(new PackageIdentity()) }),
      },
      {
        label: 'inherited package evidence',
        generation: () => fakeGenerationWithPkgEvidence({ pkg: inheritedPkg }),
      },
      {
        label: 'accessor package evidence',
        generation: () => fakeGenerationWithPkgEvidence({ pkg: accessorPkg }),
        leak: 'raw-observed-name-getter',
      },
      {
        label: 'mutable matching package evidence',
        generation: () => fakeGenerationWithPkgEvidence({ pkg: { ...expected } }),
      },
      {
        label: 'matching package with Symbol.toStringTag accessor',
        generation: () => fakeGenerationWithPkgEvidence({ pkg: tagAccessorPkg }),
        leak: 'raw-observed-to-string-tag-getter',
      },
      {
        label: 'matching package with an extra data property',
        generation: () => fakeGenerationWithPkgEvidence({ pkg: extraDataPkg }),
      },
      {
        label: 'matching shallow-frozen package with mutable nested extra data',
        generation: () => fakeGenerationWithPkgEvidence({ pkg: mutableNestedPkg }),
      },
      {
        label: 'throwing proxy package evidence',
        generation: () => fakeGenerationWithPkgEvidence({ pkg: proxyPkg }),
        leak: 'raw-observed-proxy-trap',
      },
      {
        label: 'invariant-compliant proxy package evidence',
        generation: () => fakeGenerationWithPkgEvidence({ pkg: transparentProxyPkg }),
      },
    ];

    for (const test of cases) {
      const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
      let serverCalls = 0;
      let openCalls = 0;

      try {
        const error = await rejectionOf(() =>
          start({
            cwd: asProfileRoot(cwd),
            deps: {
              materialize: () => Promise.resolve(test.generation()),
              start: () => {
                serverCalls += 1;
                return Promise.resolve(startedFixture());
              },
              open: () => {
                openCalls += 1;
              },
            },
          })
        );

        expectIdentityRefusal(error, test.label);
        if (test.leak) expect(error.message, test.label).not.to.contain(test.leak);
        expect(serverCalls, test.label).to.eql(0);
        expect(openCalls, test.label).to.eql(1);
      } finally {
        await Fs.remove(cwd);
      }
    }

    expect(accessorCalls).to.eql(0);
    expect(proxyTrapCalls).to.eql(0);
  });

  it('contains missing or hostile verification paths within the stable refusal boundary', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    let accessorCalls = 0;
    let proxyTrapCalls = 0;
    const cases: Array<{
      label: string;
      generation: () => t.Dist.Existing;
      leak?: string;
    }> = [
      {
        label: 'missing verification',
        generation: () => {
          const generation = { ...fakeGeneration() };
          Reflect.set(generation, 'verification', undefined);
          return Object.freeze(generation);
        },
      },
      {
        label: 'throwing verification accessor',
        generation: () => {
          const generation = { ...fakeGeneration() };
          Object.defineProperty(generation, 'verification', {
            enumerable: true,
            get() {
              accessorCalls += 1;
              throw new Error('raw-verification-getter');
            },
          });
          return Object.freeze(generation);
        },
        leak: 'raw-verification-getter',
      },
      {
        label: 'missing dist',
        generation: () => {
          const base = fakeGeneration();
          const verification = { ...base.verification };
          Reflect.set(verification, 'dist', undefined);
          return Object.freeze({ ...base, verification: Object.freeze(verification) });
        },
      },
      {
        label: 'throwing dist accessor',
        generation: () => {
          const base = fakeGeneration();
          const verification = { ...base.verification };
          Object.defineProperty(verification, 'dist', {
            enumerable: true,
            get() {
              accessorCalls += 1;
              throw new Error('raw-dist-getter');
            },
          });
          return Object.freeze({ ...base, verification: Object.freeze(verification) });
        },
        leak: 'raw-dist-getter',
      },
      {
        label: 'throwing pkg accessor',
        generation: () => {
          const base = fakeGeneration();
          const dist = { ...base.verification.dist };
          Object.defineProperty(dist, 'pkg', {
            enumerable: true,
            get() {
              accessorCalls += 1;
              throw new Error('raw-pkg-getter');
            },
          });
          const verification = Object.freeze({
            ...base.verification,
            dist: Object.freeze(dist),
          });
          return Object.freeze({ ...base, verification });
        },
        leak: 'raw-pkg-getter',
      },
      {
        label: 'throwing kind accessor',
        generation: () => {
          const generation = { ...fakeGeneration() };
          Object.defineProperty(generation, 'kind', {
            enumerable: true,
            get() {
              accessorCalls += 1;
              throw new Error('raw-materialized-kind-getter');
            },
          });
          return Object.freeze(generation) as t.Dist.Existing;
        },
        leak: 'raw-materialized-kind-getter',
      },
      {
        label: 'throwing dir accessor',
        generation: () => {
          const generation = { ...fakeGeneration() };
          Object.defineProperty(generation, 'dir', {
            enumerable: true,
            get() {
              accessorCalls += 1;
              throw new Error('raw-materialized-dir-getter');
            },
          });
          return Object.freeze(generation) as t.Dist.Existing;
        },
        leak: 'raw-materialized-dir-getter',
      },
      {
        label: 'throwing failed-stage accessor',
        generation: () => {
          const failure = {
            kind: 'failed',
            reason: 'resource-failure',
            cleanup: 'not-needed',
          };
          Object.defineProperty(failure, 'stage', {
            enumerable: true,
            get() {
              accessorCalls += 1;
              throw new Error('raw-materialized-stage-getter');
            },
          });
          return failure as unknown as t.Dist.Existing;
        },
        leak: 'raw-materialized-stage-getter',
      },
      {
        label: 'throwing generation proxy',
        generation: () =>
          new Proxy(fakeGeneration(), {
            getOwnPropertyDescriptor() {
              proxyTrapCalls += 1;
              throw new Error('raw-generation-proxy-trap');
            },
          }),
        leak: 'raw-generation-proxy-trap',
      },
      {
        label: 'invariant-compliant generation proxy',
        generation: () =>
          new Proxy(fakeGeneration(), {
            getPrototypeOf(target) {
              proxyTrapCalls += 1;
              return Reflect.getPrototypeOf(target);
            },
          }),
      },
      {
        label: 'invariant-compliant verification proxy',
        generation: () => {
          const base = fakeGeneration();
          const verification = new Proxy(base.verification, {
            getPrototypeOf(target) {
              proxyTrapCalls += 1;
              return Reflect.getPrototypeOf(target);
            },
          });
          return Object.freeze({ ...base, verification }) as t.Dist.Existing;
        },
      },
    ];

    for (const test of cases) {
      const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
      let serverCalls = 0;
      let openCalls = 0;

      try {
        const error = await rejectionOf(() =>
          start({
            cwd: asProfileRoot(cwd),
            deps: {
              materialize: () => Promise.resolve(test.generation()),
              start: () => {
                serverCalls += 1;
                return Promise.resolve(startedFixture());
              },
              open: () => {
                openCalls += 1;
              },
            },
          })
        );

        expectIdentityRefusal(error, test.label);
        if (test.leak) expect(error.message, test.label).not.to.contain(test.leak);
        expect(serverCalls, test.label).to.eql(0);
        expect(openCalls, test.label).to.eql(1);
      } finally {
        await Fs.remove(cwd);
      }
    }

    expect(accessorCalls).to.eql(0);
    expect(proxyTrapCalls).to.eql(0);
  });

  it('atomically admits hosted pin and package identity without hostile observation', () => {
    const expected = START_GUI_SERVICE.source.expectedPkg;
    const valid = startedFixture();
    let accessorCalls = 0;
    let proxyTrapCalls = 0;

    expect(snapshotApplicationOwner(valid, APPLICATION_EXPECTATION).kind).to.eql('admitted');

    const accessorStarted = { ...valid };
    Object.defineProperty(accessorStarted, 'verification', {
      enumerable: true,
      get() {
        accessorCalls += 1;
        throw new Error('raw-hosted-verification-getter');
      },
    });
    const accessorAuthority = { ...valid };
    Object.defineProperty(accessorAuthority, 'authority', {
      enumerable: true,
      get() {
        accessorCalls += 1;
        throw new Error('raw-hosted-authority-getter');
      },
    });
    const proxiedVerification = new Proxy(valid.verification, {
      getOwnPropertyDescriptor(target, key) {
        proxyTrapCalls += 1;
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    });
    const proxiedAuthority = new Proxy(valid.authority, {
      getOwnPropertyDescriptor(target, key) {
        proxyTrapCalls += 1;
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    });
    const mutablePkg = {
      ...valid,
      verification: {
        ...valid.verification,
        dist: {
          ...valid.verification.dist,
          pkg: { ...expected },
        },
      },
    };
    const wrongVerification = startedFixture({
      integrity:
        'sha256-1111111111111111111111111111111111111111111111111111111111111111' as t.StringHash,
    });
    const cases = [
      accessorStarted,
      accessorAuthority,
      { ...valid, verification: proxiedVerification },
      { ...valid, authority: proxiedAuthority },
      { ...valid, authority: undefined },
      { ...valid, verification: undefined },
      { ...valid, authority: { ...valid.authority } },
      {
        ...valid,
        authority: Object.freeze({
          ...valid.authority,
          integrity: wrongVerification.authority.integrity,
        }),
      },
      { ...wrongVerification, authority: valid.authority },
      mutablePkg,
    ];

    for (const started of cases) {
      const snapshot = snapshotApplicationOwner(started, APPLICATION_EXPECTATION);
      expect(snapshot.kind).to.eql('refused');
      expect(snapshot.owner).not.to.eql(undefined);
    }

    const retained = snapshotApplicationOwner(valid, APPLICATION_EXPECTATION);
    Object.defineProperties(valid, {
      authority: {
        configurable: true,
        enumerable: true,
        value: wrongVerification.authority,
      },
      verification: {
        configurable: true,
        enumerable: true,
        value: wrongVerification.verification,
      },
    });
    expect(retained.kind).to.eql('admitted');
    expect(accessorCalls).to.eql(0);
    expect(proxyTrapCalls).to.eql(0);
  });

  it('rejects hostile or malformed source evidence without creating split authority', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const manifestUrl = 'https://gui.example.test/release/dist.json' as t.StringUrl;
    const integrity =
      'sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as t.StringHash;
    let accessorCalls = 0;
    let proxyTrapCalls = 0;
    let materializeCalls = 0;
    let serverCalls = 0;
    let openCalls = 0;
    const validExpectedPkg = Object.freeze({ name: '@sample/gui', version: '1.0.0' });
    const expectedPkg = Object.defineProperties({}, {
      name: {
        enumerable: true,
        get() {
          accessorCalls += 1;
          throw new Error('raw-expected-name-getter');
        },
      },
      version: { enumerable: true, value: '1.0.0' },
    });
    const nestedAccessor = Object.freeze({
      kind: 'release' as const,
      manifestUrl,
      integrity,
      expectedPkg,
    }) as StartGuiEvidence;
    const outerAccessor = { kind: 'release' as const, manifestUrl, integrity };
    Object.defineProperty(outerAccessor, 'expectedPkg', {
      enumerable: true,
      get() {
        accessorCalls += 1;
        throw new Error('raw-expected-package-getter');
      },
    });
    const sourceTagAccessor = {
      kind: 'release' as const,
      manifestUrl,
      integrity,
      expectedPkg: validExpectedPkg,
    };
    Object.defineProperty(sourceTagAccessor, Symbol.toStringTag, {
      enumerable: true,
      get() {
        accessorCalls += 1;
        throw new Error('raw-source-to-string-tag-getter');
      },
    });
    const expectedTagAccessor = { ...validExpectedPkg };
    Object.defineProperty(expectedTagAccessor, Symbol.toStringTag, {
      enumerable: true,
      get() {
        accessorCalls += 1;
        throw new Error('raw-expected-to-string-tag-getter');
      },
    });
    const proxiedExpectedPkg = new Proxy(validExpectedPkg, {
      getOwnPropertyDescriptor(target, key) {
        proxyTrapCalls += 1;
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    });
    const proxiedSource = new Proxy(
      Object.freeze({
        kind: 'release' as const,
        manifestUrl,
        integrity,
        expectedPkg: validExpectedPkg,
      }),
      {
        getOwnPropertyDescriptor(target, key) {
          proxyTrapCalls += 1;
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      },
    );
    const diagnostics = { manifestUrl, integrity } as const;
    const cases: ReadonlyArray<{
      label: string;
      source: StartGuiEvidence;
      leak?: string;
      diagnostics: IdentityDiagnostics | null;
    }> = [
      {
        label: 'explicit null source',
        source: null as unknown as StartGuiEvidence,
        diagnostics: null,
      },
      {
        label: 'nested accessor',
        source: nestedAccessor,
        leak: 'raw-expected-name-getter',
        diagnostics,
      },
      {
        label: 'outer accessor',
        source: Object.freeze(outerAccessor) as StartGuiEvidence,
        leak: 'raw-expected-package-getter',
        diagnostics,
      },
      {
        label: 'source Symbol.toStringTag accessor',
        source: Object.freeze(sourceTagAccessor) as StartGuiEvidence,
        leak: 'raw-source-to-string-tag-getter',
        diagnostics,
      },
      {
        label: 'expected package Symbol.toStringTag accessor',
        source: Object.freeze({
          kind: 'release' as const,
          manifestUrl,
          integrity,
          expectedPkg: Object.freeze(expectedTagAccessor),
        }) as StartGuiEvidence,
        leak: 'raw-expected-to-string-tag-getter',
        diagnostics,
      },
      {
        label: 'expected package with extra data',
        source: Object.freeze({
          kind: 'release' as const,
          manifestUrl,
          integrity,
          expectedPkg: Object.freeze({ ...validExpectedPkg, channel: 'hostile-extra' }),
        }) as StartGuiEvidence,
        diagnostics,
      },
      {
        label: 'source above the descriptor-inspection bound',
        source: Object.freeze({
          kind: 'release' as const,
          manifestUrl,
          integrity,
          expectedPkg: validExpectedPkg,
          extra0: 0,
          extra1: 1,
          extra2: 2,
          extra3: 3,
          extra4: 4,
        }) as unknown as StartGuiEvidence,
        diagnostics: null,
      },
      {
        label: 'invariant-compliant expected package proxy',
        source: Object.freeze({
          kind: 'release' as const,
          manifestUrl,
          integrity,
          expectedPkg: proxiedExpectedPkg,
        }),
        diagnostics,
      },
      {
        label: 'invariant-compliant source proxy',
        source: proxiedSource,
        diagnostics: null,
      },
    ];

    try {
      for (const test of cases) {
        const error = await rejectionOf(() =>
          start({
            cwd: asProfileRoot(cwd),
            source: test.source,
            deps: {
              materialize: () => {
                materializeCalls += 1;
                return Promise.resolve(fakeGeneration());
              },
              start: () => {
                serverCalls += 1;
                return Promise.resolve(startedFixture());
              },
              open: () => {
                openCalls += 1;
              },
            },
          })
        );

        expectIdentityRefusal(error, test.label, test.diagnostics);
        if (test.leak) expect(error.message, test.label).not.to.contain(test.leak);
      }

      expect(accessorCalls).to.eql(0);
      expect(proxyTrapCalls).to.eql(0);
      expect(materializeCalls).to.eql(0);
      expect(serverCalls).to.eql(0);
      expect(openCalls).to.eql(cases.length);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('rejects malformed source URL and integrity before materialization', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const validIntegrity =
      'sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as t.StringHash;
    const cases: Array<{ source: StartGuiEvidence; message: string }> = [
      {
        source: {
          kind: 'release',
          manifestUrl: 'file:///tmp/dist.json',
          integrity: validIntegrity,
          expectedPkg: START_GUI_SERVICE.source.expectedPkg,
        },
        message: 'Invalid start:gui manifest URL.',
      },
      ...[
        'https://@gui.example.test/dist.json',
        'https://user:secret@gui.example.test/dist.json',
        'https://gui.example.test/dist.json?',
        'https://gui.example.test/dist.json?channel=mutable',
        'https://gui.example.test/dist.json#',
        'https://gui.example.test/dist.json#fragment',
        `https://gui.example.test/\u001bcontrol`,
        `https://gui.example.test/${'a'.repeat(AUTHORITY_LIMITS.manifestUrl)}`,
      ].map((manifestUrl) => ({
        source: {
          kind: 'release' as const,
          manifestUrl,
          integrity: validIntegrity,
          expectedPkg: START_GUI_SERVICE.source.expectedPkg,
        },
        message: 'Invalid start:gui manifest URL.',
      })),
      {
        source: {
          kind: 'release',
          manifestUrl: 'https://gui.example.test/dist.json',
          integrity: 'sha256-invalid',
          expectedPkg: START_GUI_SERVICE.source.expectedPkg,
        },
        message: 'Invalid start:gui manifest integrity.',
      },
    ];

    try {
      for (const { source, message } of cases) {
        let materializeCalls = 0;
        const error = await rejectionOf(() =>
          start({
            cwd: asProfileRoot(cwd),
            source,
            deps: {
              materialize: () => {
                materializeCalls += 1;
                return Promise.resolve(fakeGeneration());
              },
            },
          })
        );

        expect(error.message).to.eql(message);
        expect(materializeCalls).to.eql(0);
      }
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('binds controls before one browser-open attempt and retains opener failure as nonfatal', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const events: string[] = [];
    const keyboardDone = deferred();
    let onQuit: (() => void | Promise<void>) | undefined;
    const keyboard: Keyboard = {
      dispose: () => {
        events.push('keyboard.dispose');
        keyboardDone.resolve();
      },
      finished: keyboardDone.promise,
    };

    try {
      await start({
        cwd: asProfileRoot(cwd),
        deps: {
          materialize: () => Promise.resolve(fakeGeneration()),
          start: async () => {
            events.push('app.start');
            await onQuit?.();
            keyboardDone.resolve();
            return startedFixture();
          },
          bindKeyboard: (input) => {
            events.push('keyboard.bind');
            onQuit = input.onQuit;
            return keyboard;
          },
          open: () => {
            events.push('open');
            throw new Error('open failed');
          },
        },
      });

      expect(events).to.eql(['keyboard.bind', 'open', 'app.start', 'keyboard.dispose']);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('observes an unexpected rejected opener Promise as nonfatal presentation evidence', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const keyboardDone = deferred();
    const rawFailure = new Error('raw asynchronous opener failure');
    let onQuit: (() => void | Promise<void>) | undefined;
    let warnings = 0;

    try {
      await start({
        cwd: asProfileRoot(cwd),
        deps: {
          materialize: () => Promise.resolve(fakeGeneration()),
          start: async () => {
            await Promise.resolve();
            await onQuit?.();
            keyboardDone.resolve();
            return startedFixture();
          },
          bindKeyboard: (input) => {
            onQuit = input.onQuit;
            return {
              finished: keyboardDone.promise,
              dispose: keyboardDone.resolve,
            };
          },
          createScreen: () => ({
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            redraw() {},
            warnOpen() {
              warnings += 1;
            },
            dispose() {},
          }),
          open: () => Promise.reject(rawFailure),
        },
      });

      expect(warnings).to.eql(1);
    } finally {
      keyboardDone.resolve();
      await Fs.remove(cwd);
    }
  });

  it('retains an unobservable opener thenable without invoking its accessors', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const keyboardDone = deferred();
    let onQuit: (() => void | Promise<void>) | undefined;
    let thenCalls = 0;
    let warnings = 0;
    const thenable = {
      get then() {
        thenCalls += 1;
        throw new Error('hostile opener then accessor invoked');
      },
    };

    try {
      await start({
        cwd: asProfileRoot(cwd),
        deps: {
          materialize: () => Promise.resolve(fakeGeneration()),
          start: async () => {
            await onQuit?.();
            keyboardDone.resolve();
            return startedFixture();
          },
          bindKeyboard: (input) => {
            onQuit = input.onQuit;
            return {
              finished: keyboardDone.promise,
              dispose: keyboardDone.resolve,
            };
          },
          createScreen: () => ({
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            redraw() {},
            warnOpen() {
              warnings += 1;
            },
            dispose() {},
          }),
          open: () => thenable,
        },
      });

      expect({ thenCalls, warnings }).to.eql({ thenCalls: 0, warnings: 1 });
    } finally {
      keyboardDone.resolve();
      await Fs.remove(cwd);
    }
  });

  it('blocks browser open when an already-settled screen failure wins', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const screenFailure = new Error('screen failed');
    const stop = new AbortController();
    let closeCalls = 0;
    let openCalls = 0;

    try {
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(cwd),
          until: stop.signal,
          deps: {
            materialize: () => Promise.resolve(fakeGeneration()),
            start: () =>
              Promise.resolve(startedFixture({
                close: () => {
                  closeCalls += 1;
                  return Promise.resolve();
                },
              })),
            createScreen: (input) => {
              const release = input.state.subscribe((state) => {
                if (state.kind === 'failed') {
                  queueMicrotask(() => stop.abort('screen failure observed'));
                }
              });
              return {
                kind: 'acquired',
                failure: Promise.reject(screenFailure),
                redraw() {},
                warnOpen() {},
                dispose: release,
              };
            },
            open: () => {
              openCalls += 1;
            },
          },
        })
      );

      expect(error).not.to.equal(screenFailure);
      expect(error.message).to.eql('start:gui screen failed.');
      expect(openCalls).to.eql(0);
      expect(closeCalls).to.eql(0);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('closes the host when responsive screen reporting fails', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const screenFailure = new Error('screen failed');
    const stop = new AbortController();
    let closeCalls = 0;

    try {
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(cwd),
          until: stop.signal,
          deps: {
            materialize: () => Promise.resolve(fakeGeneration()),
            start: () =>
              Promise.resolve(startedFixture({
                close: () => {
                  closeCalls += 1;
                  return Promise.resolve();
                },
              })),
            createScreen: (input) => {
              const failure = Promise.withResolvers<never>();
              const release = input.state.subscribe((state) => {
                if (state.kind !== 'ready') return;
                failure.reject(screenFailure);
                queueMicrotask(() => stop.abort('screen failure observed'));
              });
              return {
                kind: 'acquired',
                failure: failure.promise,
                redraw() {},
                warnOpen() {},
                dispose: release,
              };
            },
            open: () => undefined,
          },
        })
      );

      expect(error).not.to.equal(screenFailure);
      expect(error.message).to.eql('start:gui screen failed.');
      expect(closeCalls).to.eql(1);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('contains keyboard-bind failure without opening a browser', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const bindFailure = new Error('keyboard bind failed');
    let closeCalls = 0;
    let openCalls = 0;

    try {
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(cwd),
          deps: {
            materialize: () => Promise.resolve(fakeGeneration()),
            start: () =>
              Promise.resolve(startedFixture({
                close: () => {
                  closeCalls += 1;
                  return Promise.resolve();
                },
              })),
            bindKeyboard: () => {
              throw bindFailure;
            },
            open: () => {
              openCalls += 1;
            },
          },
        })
      );

      expect(error).not.to.equal(bindFailure);
      expect(error.message).to.eql('start:gui controls failed.');
      expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
        kind: 'cleanup-failed',
        issues: [{ resource: 'keyboard', state: 'unresolved' }],
      });
      expect(openCalls).to.eql(0);
      expect(closeCalls).to.eql(0);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('fails unavailable keyboard controls before screen, browser, or boot work', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    let materializeCalls = 0;
    let applicationStarts = 0;
    let screenCalls = 0;
    let openCalls = 0;

    try {
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(cwd),
          deps: {
            materialize: () => {
              materializeCalls += 1;
              return Promise.resolve(fakeGeneration());
            },
            start: () => {
              applicationStarts += 1;
              return Promise.resolve(startedFixture());
            },
            bindKeyboard: () => undefined,
            createScreen: () => {
              screenCalls += 1;
              throw new Error('screen must not start without keyboard controls');
            },
            open: () => {
              openCalls += 1;
            },
          },
        })
      );

      expect(error.message).to.eql('start:gui keyboard unavailable.');
      expect(materializeCalls).to.eql(0);
      expect(applicationStarts).to.eql(0);
      expect(screenCalls).to.eql(0);
      expect(openCalls).to.eql(0);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('retains unresolved listener cleanup as typed secondary evidence', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const storeDir = Fs.join(cwd, '.pi/@sys/dist/@sys.driver-pi') as t.StringDir;
    const primary = new Error('screen failed');
    const cleanup = new Error('close failed');
    const listenerFinished = deferred();
    const stop = new AbortController();
    let closeCalls = 0;

    try {
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(cwd),
          until: stop.signal,
          deps: {
            materialize: () => Promise.resolve(fakeGeneration()),
            start: () =>
              Promise.resolve(startedFixture({
                finished: listenerFinished.promise,
                close: () => {
                  closeCalls += 1;
                  return Promise.reject(cleanup);
                },
              })),
            createScreen: (input) => {
              const failure = Promise.withResolvers<never>();
              const release = input.state.subscribe((state) => {
                if (state.kind !== 'ready') return;
                failure.reject(primary);
                queueMicrotask(() => stop.abort('screen failure observed'));
              });
              return {
                kind: 'acquired',
                failure: failure.promise,
                redraw() {},
                warnOpen() {},
                dispose: release,
              };
            },
            open: () => undefined,
          },
        })
      );

      expect(error).not.to.equal(primary);
      expect(error.message).to.eql('start:gui screen failed.');
      expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
        kind: 'cleanup-failed',
        issues: [
          { resource: 'application-listener', state: 'unresolved' },
          { resource: 'generation-lease', state: 'unresolved' },
        ],
      });
      expect(closeCalls).to.eql(1);
      listenerFinished.resolve();
      await removeDistStore(storeDir);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('uses the lower server lifecycle for external cancellation', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const aborted = new AbortController();
    const startedSignal = deferred();
    const stopped = deferred();
    const closeReasons: unknown[] = [];
    let materializeUntil: t.UntilInput | undefined;
    let startUntil: t.UntilInput | undefined;
    let closed = false;
    const started = startedFixture({
      finished: stopped.promise,
      close: (reason) => {
        if (!closed) {
          closed = true;
          closeReasons.push(reason);
          stopped.resolve();
        }
        return Promise.resolve();
      },
    });

    try {
      const run = start({
        cwd: asProfileRoot(cwd),
        until: aborted.signal,
        deps: {
          materialize: (args) => {
            materializeUntil = args.until;
            return Promise.resolve(fakeGeneration());
          },
          start: (args) => {
            startUntil = args.until;
            (args.until as AbortSignal).addEventListener('abort', () => {
              void started.close('lower.until');
            }, { once: true });
            startedSignal.resolve();
            return Promise.resolve(started);
          },
          open: () => undefined,
        },
      });

      await startedSignal.promise;
      const rawReason = new Error('caller-owned cancellation reason');
      aborted.abort(rawReason);
      const completion = await run;

      expect(startGuiCompletionKind(completion)).to.eql('external-cancellation');
      expect(materializeUntil).to.equal(startUntil);
      expect(materializeUntil).to.be.an.instanceOf(AbortSignal);
      expect(materializeUntil).not.to.equal(aborted.signal);
      expect((materializeUntil as AbortSignal).aborted).to.eql(true);
      expect((materializeUntil as AbortSignal).reason).to.eql(
        'start:gui.external-cancellation',
      );
      expect((materializeUntil as AbortSignal).reason).not.to.equal(rawReason);
      expect(closeReasons).to.eql(['lower.until']);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('returns the keyboard stop disposition when clean back wins during preparing', async () => {
    const keyboardFinished = deferred();
    let materializeCalls = 0;
    let disposition: ReturnType<
      NonNullable<Parameters<typeof Cli.Keyboard.bind>[0]['onKey']>
    > = undefined;

    const completion = await startRuntime({
      cwd: asProfileRoot('/tmp/driver-pi-preparing-back-test'),
      deps: {
        startStatus: () => Promise.resolve(bootstrapStatusFixture()),
        materialize: () => {
          materializeCalls += 1;
          return Promise.resolve(fakeGeneration());
        },
        bindKeyboard(input) {
          disposition = input.onKey?.(keypress('left', {
            altKey: false,
            ctrlKey: true,
            metaKey: false,
            shiftKey: false,
          }));
          return {
            finished: keyboardFinished.promise,
            dispose: keyboardFinished.resolve,
          };
        },
        createScreen() {
          throw new Error('Back during preparing must block screen acquisition.');
        },
      },
    });

    expect(disposition).to.eql('stop');
    expect(startGuiCompletionKind(completion)).to.eql('back');
    expect(materializeCalls).to.eql(0);
  });

  it('maps exact lowercase r to redraw and exact Ctrl+Arrow Left to clean back', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const serverFinished = deferred();
    const appStarted = deferred();
    const closeReasons: unknown[] = [];
    let disposeCalls = 0;
    let openCalls = 0;
    let redrawCalls = 0;
    let onKey: NonNullable<Parameters<typeof Cli.Keyboard.bind>[0]['onKey']> | undefined;
    let onQuit: (() => void | Promise<void>) | undefined;
    const bound = deferred();
    const keyboardFinished = deferred();
    const keyboard: Keyboard = {
      dispose: () => {
        disposeCalls += 1;
        keyboardFinished.resolve();
      },
      finished: keyboardFinished.promise,
    };

    try {
      const run = start({
        cwd: asProfileRoot(cwd),
        deps: {
          materialize: () => Promise.resolve(fakeGeneration()),
          start: () => {
            appStarted.resolve();
            return Promise.resolve(startedFixture({
              finished: serverFinished.promise,
              close: (reason) => {
                closeReasons.push(reason);
                serverFinished.resolve();
                return Promise.resolve();
              },
            }));
          },
          open: () => void (openCalls += 1),
          bindKeyboard: (input) => {
            onKey = input.onKey;
            onQuit = input.onQuit;
            void input.onKey?.(keypress('r', {
              altKey: false,
              ctrlKey: false,
              metaKey: false,
              shiftKey: false,
            }));
            bound.resolve();
            return keyboard;
          },
          createScreen: () => ({
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            redraw: () => void (redrawCalls += 1),
            warnOpen() {},
            dispose() {},
          }),
        },
      });

      await bound.promise;
      await appStarted.promise;
      if (!onKey || !onQuit) throw new Error('Expected start:gui keyboard callbacks.');
      await onKey(keypress('r'));
      await onKey(keypress('R', {
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
      }));
      await onKey(keypress('r', {
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: true,
      }));
      await onKey(keypress('r', {
        altKey: false,
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
      }));
      await onKey(keypress('r', {
        altKey: true,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
      }));
      await onKey(keypress('r', {
        altKey: false,
        ctrlKey: false,
        metaKey: true,
        shiftKey: false,
      }));
      expect({ closeReasons, openCalls, redrawCalls }).to.eql({
        closeReasons: [],
        openCalls: 1,
        redrawCalls: 0,
      });

      const redraw = keypress('r', {
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
      });
      await onKey(redraw);
      await onKey(redraw);
      await onKey(keypress('right', { ctrlKey: true }));
      await onKey(keypress('left'));
      await onKey(keypress('left', { ctrlKey: true, altKey: true }));
      await onKey(keypress('left', { ctrlKey: true, metaKey: true }));
      await onKey(keypress('left', { ctrlKey: true, shiftKey: true }));
      expect({ closeReasons, openCalls, redrawCalls }).to.eql({
        closeReasons: [],
        openCalls: 1,
        redrawCalls: 2,
      });
      const back = keypress('left', {
        altKey: false,
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
      });
      const firstBack = await onKey(back);
      const secondBack = await onKey(back);
      await onQuit();
      const completion = await run;

      expect([firstBack, secondBack]).to.eql(['stop', 'stop']);
      expect(startGuiCompletionKind(completion)).to.eql('back');
      expect(closeReasons).to.eql(['start:gui.finalized']);
      expect(disposeCalls).to.eql(1);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('publishes redraw throws through screen failure precedence', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const stop = new AbortController();
    const serverFinished = deferred();
    const appStarted = deferred();
    const keyboardFinished = deferred();
    const redrawFailure = new Error('raw redraw failure');
    let closeCalls = 0;
    let redrawCalls = 0;
    let onKey: NonNullable<Parameters<typeof Cli.Keyboard.bind>[0]['onKey']> | undefined;
    let onQuit: (() => void | Promise<void>) | undefined;

    try {
      const run = start({
        cwd: asProfileRoot(cwd),
        until: stop.signal,
        deps: {
          materialize: () => Promise.resolve(fakeGeneration()),
          start: () => {
            appStarted.resolve();
            return Promise.resolve(startedFixture({
              finished: serverFinished.promise,
              close: () => {
                closeCalls += 1;
                serverFinished.resolve();
                return Promise.resolve();
              },
            }));
          },
          open: () => undefined,
          bindKeyboard: (input) => {
            onKey = input.onKey;
            onQuit = input.onQuit;
            return {
              finished: keyboardFinished.promise,
              dispose: keyboardFinished.resolve,
            };
          },
          createScreen: () => ({
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            redraw() {
              redrawCalls += 1;
              throw redrawFailure;
            },
            warnOpen() {},
            dispose() {},
          }),
        },
      });
      const rejected = rejectionOf(() => run);

      await appStarted.promise;
      if (!onKey || !onQuit) throw new Error('Expected start:gui keyboard callbacks.');
      const redraw = keypress('r', {
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
      });
      await onKey(redraw);
      await onKey(redraw);
      await onQuit();

      const error = await rejected;
      expect(error).not.to.equal(redrawFailure);
      expect(error.message).to.eql('start:gui screen failed.');
      expect({ closeCalls, redrawCalls }).to.eql({ closeCalls: 1, redrawCalls: 1 });
    } finally {
      keyboardFinished.resolve();
      stop.abort('redraw failure test cleanup');
      await Fs.remove(cwd);
    }
  });

  it('makes redraw inert after direct package screen-failure publication', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const stop = new AbortController();
    const serverFinished = deferred();
    const appStarted = deferred();
    const keyboardFinished = deferred();
    let closeCalls = 0;
    let redrawCalls = 0;
    let onKey: NonNullable<Parameters<typeof Cli.Keyboard.bind>[0]['onKey']> | undefined;
    let onQuit: (() => void | Promise<void>) | undefined;

    try {
      const run = start({
        cwd: asProfileRoot(cwd),
        until: stop.signal,
        deps: {
          materialize: () => Promise.resolve(fakeGeneration()),
          start: () => {
            appStarted.resolve();
            return Promise.resolve(startedFixture({
              finished: serverFinished.promise,
              close: () => {
                closeCalls += 1;
                serverFinished.resolve();
                return Promise.resolve();
              },
            }));
          },
          open: () => undefined,
          bindKeyboard: (input) => {
            onKey = input.onKey;
            onQuit = input.onQuit;
            return {
              finished: keyboardFinished.promise,
              dispose: keyboardFinished.resolve,
            };
          },
          createScreen: (input) => ({
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            redraw() {
              redrawCalls += 1;
              input.onFailure(new Error('direct screen failure'));
            },
            warnOpen() {},
            dispose() {},
          }),
        },
      });
      const rejected = rejectionOf(() => run);

      await appStarted.promise;
      if (!onKey || !onQuit) throw new Error('Expected start:gui keyboard callbacks.');
      const redraw = keypress('r', {
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
      });
      await onKey(redraw);
      await onKey(redraw);
      await onQuit();

      const error = await rejected;
      expect(error.message).to.eql('start:gui screen failed.');
      expect({ closeCalls, redrawCalls }).to.eql({ closeCalls: 1, redrawCalls: 1 });
    } finally {
      keyboardFinished.resolve();
      stop.abort('direct screen failure test cleanup');
      await Fs.remove(cwd);
    }
  });

  it('makes redraw inert after screen failure-promise rejection', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const stop = new AbortController();
    const serverFinished = deferred();
    const appStarted = deferred();
    const keyboardFinished = deferred();
    const failedState = deferred();
    const screenFailure = Promise.withResolvers<never>();
    let closeCalls = 0;
    let redrawCalls = 0;
    let onKey: NonNullable<Parameters<typeof Cli.Keyboard.bind>[0]['onKey']> | undefined;
    let onQuit: (() => void | Promise<void>) | undefined;

    try {
      const run = start({
        cwd: asProfileRoot(cwd),
        until: stop.signal,
        deps: {
          materialize: () => Promise.resolve(fakeGeneration()),
          start: () => {
            appStarted.resolve();
            return Promise.resolve(startedFixture({
              finished: serverFinished.promise,
              close: () => {
                closeCalls += 1;
                serverFinished.resolve();
                return Promise.resolve();
              },
            }));
          },
          open: () => undefined,
          bindKeyboard: (input) => {
            onKey = input.onKey;
            onQuit = input.onQuit;
            return {
              finished: keyboardFinished.promise,
              dispose: keyboardFinished.resolve,
            };
          },
          createScreen: (input) => {
            const release = input.state.subscribe((state) => {
              if (state.kind === 'failed') failedState.resolve();
            });
            return {
              kind: 'acquired',
              failure: screenFailure.promise,
              redraw: () => void (redrawCalls += 1),
              warnOpen() {},
              dispose: release,
            };
          },
        },
      });
      const rejected = rejectionOf(() => run);

      await appStarted.promise;
      if (!onKey || !onQuit) throw new Error('Expected start:gui keyboard callbacks.');
      screenFailure.reject(new Error('screen failure promise rejected'));
      await failedState.promise;
      await onKey(keypress('r', {
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
      }));
      await onQuit();

      const error = await rejected;
      expect(error.message).to.eql('start:gui screen failed.');
      expect({ closeCalls, redrawCalls }).to.eql({ closeCalls: 1, redrawCalls: 0 });
    } finally {
      keyboardFinished.resolve();
      stop.abort('screen failure promise test cleanup');
      await Fs.remove(cwd);
    }
  });

  it('closes once after keyboard quit and disposes the binding', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const serverFinished = deferred();
    const appStarted = deferred();
    let closeCalls = 0;
    let disposeCalls = 0;
    let onKey: NonNullable<Parameters<typeof Cli.Keyboard.bind>[0]['onKey']> | undefined;
    let onQuit: (() => void | Promise<void>) | undefined;
    const bound = deferred();
    const keyboardFinished = deferred();
    const keyboard: Keyboard = {
      dispose: () => {
        disposeCalls += 1;
        keyboardFinished.resolve();
      },
      finished: keyboardFinished.promise,
    };

    try {
      const run = start({
        cwd: asProfileRoot(cwd),
        deps: {
          materialize: () => Promise.resolve(fakeGeneration()),
          start: () => {
            appStarted.resolve();
            return Promise.resolve(startedFixture({
              finished: serverFinished.promise,
              close: () => {
                closeCalls += 1;
                serverFinished.resolve();
                return Promise.resolve();
              },
            }));
          },
          open: () => undefined,
          bindKeyboard: (input) => {
            onKey = input.onKey;
            onQuit = input.onQuit;
            bound.resolve();
            return keyboard;
          },
        },
      });

      await bound.promise;
      await appStarted.promise;
      if (!onKey || !onQuit) throw new Error('Expected start:gui keyboard callbacks.');
      await onQuit();
      await onKey(keypress('left', { ctrlKey: true }));
      const completion = await run;

      expect(startGuiCompletionKind(completion)).to.eql('quit');
      expect(closeCalls).to.eql(1);
      expect(disposeCalls).to.eql(1);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('refuses a real verified Dist whose package identity differs before startup', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const temporary = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const cwd = (await Fs.realPath(temporary)) as t.StringDir;
    const fixture = await loopbackDistFixture();
    const failures: unknown[] = [];
    let serverCalls = 0;
    let openCalls = 0;

    try {
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(cwd),
          source: {
            kind: 'release',
            manifestUrl: fixture.manifestUrl,
            integrity: fixture.integrity,
            expectedPkg: Object.freeze({ ...fixture.expectedPkg, version: '2.0.0' }),
          },
          deps: {
            start: () => {
              serverCalls += 1;
              return Promise.resolve(startedFixture());
            },
            open: () => {
              openCalls += 1;
            },
          },
        })
      );

      expectIdentityRefusal(error, 'real verified mismatch', fixture);
      expect(serverCalls).to.eql(0);
      expect(openCalls).to.eql(1);
    } catch (cause) {
      failures.push(cause);
    }

    try {
      await fixture.dispose();
    } catch (cause) {
      failures.push(cause);
    }
    const storeDir = Fs.join(cwd, '.pi/@sys/dist/@sys.driver-pi') as t.StringDir;
    let storeRemoved = false;
    try {
      await removeDistStore(storeDir);
      storeRemoved = true;
    } catch (cause) {
      failures.push(cause);
    }
    if (storeRemoved) {
      try {
        await Fs.remove(cwd);
      } catch (cause) {
        failures.push(cause);
      }
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1) {
      throw new AggregateError(failures, 'Driver Pi mismatch fixture cleanup failed.');
    }
  });

  it('materializes, redirects through bootstrap, fetches, and closes an opaque Dist', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const temporary = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const cwd = (await Fs.realPath(temporary)) as t.StringDir;
    const fixture = await loopbackDistFixture();
    const stop = new AbortController();
    let opened = 0;
    let body = '';
    let visit: Promise<void> | undefined;
    const stateSettled = Promise.withResolvers<void>();
    const failures: unknown[] = [];

    try {
      await start({
        cwd: asProfileRoot(cwd),
        until: stop.signal,
        source: {
          kind: 'release',
          manifestUrl: fixture.manifestUrl,
          integrity: fixture.integrity,
          expectedPkg: fixture.expectedPkg,
        },
        deps: {
          startStatus: BootstrapStatusHost.start,
          start: (args) =>
            DistServer.start({
              ...args,
              integrity: fixture.integrity,
              silent: true,
            }),
          createScreen: (input) => {
            const release = input.state.subscribe((state) => {
              if (state.kind === 'ready' || state.kind === 'failed') stateSettled.resolve();
            });
            return {
              kind: 'acquired',
              failure: new Promise<never>(() => undefined),
              redraw() {},
              warnOpen() {},
              dispose: release,
            };
          },
          open: (_cwd, capabilityUrl) => {
            opened += 1;
            visit = (async () => {
              try {
                await stateSettled.promise;
                const status = await fetch(capabilityUrl, { redirect: 'manual' });
                await status.body?.cancel();
                expect(status.status).to.eql(303);
                const location = status.headers.get('location');
                if (!location) throw new Error('Expected application redirect location.');
                const response = await fetch(location);
                expect(response.status).to.eql(200);
                body = await response.text();
              } finally {
                stop.abort('driver-pi.start-gui.capstone');
              }
            })();
          },
        },
      });

      await visit;
      expect(opened).to.eql(1);
      expect(body).to.contain('verified driver-pi fixture');
    } catch (cause) {
      failures.push(cause);
    }

    try {
      await fixture.dispose();
    } catch (cause) {
      failures.push(cause);
    }
    const storeDir = Fs.join(cwd, '.pi/@sys/dist/@sys.driver-pi') as t.StringDir;
    let storeRemoved = false;
    try {
      await removeDistStore(storeDir);
      storeRemoved = true;
    } catch (cause) {
      failures.push(cause);
    }
    if (storeRemoved) {
      try {
        await Fs.remove(cwd);
      } catch (cause) {
        failures.push(cause);
      }
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1) {
      throw new AggregateError(failures, 'Driver Pi Dist fixture cleanup failed.');
    }
  });
});

/**
 * Helpers:
 */
function containsText(input: unknown, needle: string): boolean {
  const seen = new Set<object>();
  let remaining = 10_000;
  const visit = (value: unknown, depth: number): boolean => {
    if (typeof value === 'string') return value.includes(needle);
    if (
      value === null || (typeof value !== 'object' && typeof value !== 'function') ||
      depth > 12 || remaining-- <= 0 || seen.has(value)
    ) return false;
    seen.add(value);
    try {
      for (const key of Reflect.ownKeys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (descriptor && 'value' in descriptor && visit(descriptor.value, depth + 1)) return true;
      }
    } catch {
      return false;
    }
    return false;
  };
  return visit(input, 0);
}

function automaticSession(autoQuit: boolean): Pick<
  StartGuiDependencies,
  'startStatus' | 'bindKeyboard' | 'createScreen'
> {
  const statusDone = deferred();
  const keyboardDone = deferred();
  let disposed = false;
  let terminalObserved = false;
  let onQuit: (() => void | Promise<void>) | undefined;
  let closePromise: Promise<void> | undefined;
  let releaseState: (() => void) | undefined;

  const observeTerminal = (state: Parameters<StartGuiDependencies['createScreen']>[0]['state']) => {
    if (terminalObserved) return;
    const current = state.current;
    if (current.kind !== 'ready' && current.kind !== 'failed') return;
    terminalObserved = true;
    try {
      onQuit?.();
    } finally {
      keyboardDone.resolve();
    }
  };

  const closeStatus = (): Promise<void> => {
    if (!closePromise) {
      disposed = true;
      statusDone.resolve();
      closePromise = statusDone.promise;
    }
    return closePromise;
  };
  const startStatus = <K extends string>(
    _options: BootstrapStatus.StartOptions<K>,
  ): Promise<BootstrapStatus.Started> =>
    Promise.resolve(Object.freeze({
      url: 'http://127.0.0.1:49152/0123456789abcdefghijklmnopqrstuvwxyzabcd' as t.StringUrl,
      finished: statusDone.promise,
      get disposed() {
        return disposed;
      },
      close: closeStatus,
      [Symbol.asyncDispose]: () => closeStatus(),
    }));

  return {
    startStatus,
    bindKeyboard(options) {
      onQuit = options.onQuit;
      return {
        finished: keyboardDone.promise,
        dispose() {
          keyboardDone.resolve();
        },
      };
    },
    createScreen: (input) => {
      if (autoQuit) {
        releaseState = input.state.subscribe(() => observeTerminal(input.state));
        observeTerminal(input.state);
      }
      return {
        kind: 'acquired',
        failure: new Promise<never>(() => undefined),
        redraw() {},
        warnOpen() {},
        dispose() {
          releaseState?.();
          releaseState = undefined;
        },
      };
    },
  };
}

type KeyboardEvent = Parameters<NonNullable<Parameters<typeof Cli.Keyboard.bind>[0]['onKey']>>[0];
type KeypressModifiers = Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>;

type IdentityDiagnostics = Readonly<{
  manifestUrl: t.StringUrl;
  integrity: t.StringHash;
}>;

function expectIdentityRefusal(
  error: Error,
  label: string,
  diagnostics: IdentityDiagnostics | null = START_GUI_SERVICE.source,
): void {
  expect(error.message, label).to.eql('start:gui refused GUI Dist package identity.');
  const identity = (error as Error & { identity?: unknown }).identity;
  if (!diagnostics) {
    expect(identity, label).to.eql(undefined);
    return;
  }
  expect(identity, label).to.eql({
    kind: 'refused',
    manifestUrl: diagnostics.manifestUrl,
    integrity: diagnostics.integrity,
  });
}

function keypress(key: string, modifiers: Partial<KeypressModifiers> = {}) {
  return { key, ...modifiers } as KeyboardEvent;
}
