import { describe, expect, it } from '../../../-test.ts';
import { type Cli, Fs, type t } from '../common.ts';
import { DistServer } from '@sys/server/dist';
import { VERIFIED_LOOPBACK_BROWSER_POLICY } from '../u.start/u.browser.ts';
import { start } from '../u.start/u.gui.ts';
import { START_GUI_SERVICE, type StartGuiEvidence } from '../u/u.start.gui.service.ts';
import {
  asProfileRoot,
  deferred,
  fakeGeneration,
  fakeGenerationWithPkgEvidence,
  type Keyboard,
  loopbackDistFixture,
  rejectionOf,
  removeDistStore,
  type Started,
  startedFixture,
} from './u.fixture.start.gui.ts';

describe(`@sys/driver-pi/cli/Profiles/u.start.gui`, () => {
  it('preserves materialization failure evidence without starting a listener', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const storeDir = Fs.join(cwd, '.pi/@sys/dist/@sys.driver-pi') as t.StringDir;
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
      expect(await Fs.exists(storeDir)).to.eql(true);
      expect(serverCalls).to.eql(0);
      expect(openCalls).to.eql(0);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('passes pinned materialization and loopback-host authority with one stable store root', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const storeDir = Fs.join(cwd, '.pi/@sys/dist/@sys.driver-pi') as t.StringDir;
    let materializeArgs: t.Dist.MaterializeArgs | undefined;
    let startArgs: t.DistServer.Start.Args | undefined;
    let screenInput: {
      service: string;
      dir: t.StringDir;
      origin: t.StringUrl;
      keyboard: boolean;
    } | undefined;
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
          bindKeyboard: () => undefined,
          createScreen: (input) => {
            screenInput = input;
            return {
              failure: new Promise<never>(() => {}),
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
      expect(START_GUI_SERVICE.source.expectedPkg).to.eql({
        name: '@sys/driver-pi',
        version: '0.0.131',
      });
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
      expect(await Fs.exists(storeDir)).to.eql(true);
      expect(screenInput).to.eql({
        service: 'sys.ui:pi',
        dir: '/tmp/driver-pi-gui-generation',
        origin: 'http://127.0.0.1:1234',
        keyboard: false,
      });
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
      manifestUrl: 'https://gui.example.test:8443/release/dist.json' as t.StringUrl,
      integrity:
        'sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as t.StringHash,
      expectedPkg,
    };
    let materializeArgs: t.Dist.MaterializeArgs | undefined;
    let startArgs: t.DistServer.Start.Args | undefined;

    try {
      const run = start({
        cwd: asProfileRoot(cwd),
        source,
        deps: {
          materialize: (args) => {
            materializeArgs = args;
            return Promise.resolve(fakeGeneration(
              { name: '@sample/driver-pi-gui', version: '1.0.0' },
              { integrity: args.integrity, manifestUrl: args.manifestUrl },
            ));
          },
          start: (args) => {
            startArgs = args;
            return Promise.resolve(startedFixture());
          },
          bindKeyboard: () => undefined,
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
        expect(openCalls, test.label).to.eql(0);
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
        expect(openCalls, test.label).to.eql(0);
      } finally {
        await Fs.remove(cwd);
      }
    }

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
      manifestUrl,
      integrity,
      expectedPkg,
    }) as StartGuiEvidence;
    const outerAccessor = { manifestUrl, integrity };
    Object.defineProperty(outerAccessor, 'expectedPkg', {
      enumerable: true,
      get() {
        accessorCalls += 1;
        throw new Error('raw-expected-package-getter');
      },
    });
    const sourceTagAccessor = { manifestUrl, integrity, expectedPkg: validExpectedPkg };
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
      Object.freeze({ manifestUrl, integrity, expectedPkg: validExpectedPkg }),
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
          manifestUrl,
          integrity,
          expectedPkg: Object.freeze({ ...validExpectedPkg, channel: 'hostile-extra' }),
        }) as StartGuiEvidence,
        diagnostics,
      },
      {
        label: 'invariant-compliant expected package proxy',
        source: Object.freeze({ manifestUrl, integrity, expectedPkg: proxiedExpectedPkg }),
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
      expect(openCalls).to.eql(0);
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
          manifestUrl: 'file:///tmp/dist.json',
          integrity: validIntegrity,
          expectedPkg: START_GUI_SERVICE.source.expectedPkg,
        },
        message: 'Invalid start:gui manifest URL.',
      },
      {
        source: {
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

  it('binds keyboard before browser open, disposes it, and preserves open failure', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const events: string[] = [];
    const stop = deferred();
    const openFailure = new Error('open failed');
    const keyboard: Keyboard = {
      dispose: () => events.push('keyboard.dispose'),
      finished: new Promise<void>(() => undefined),
    };

    try {
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(cwd),
          deps: {
            materialize: () => Promise.resolve(fakeGeneration()),
            start: () =>
              Promise.resolve(startedFixture({
                finished: stop.promise,
                close: () => {
                  events.push('close');
                  stop.resolve();
                  return Promise.resolve();
                },
              })),
            bindKeyboard: () => {
              events.push('keyboard.bind');
              return keyboard;
            },
            open: () => {
              events.push('open');
              throw openFailure;
            },
          },
        })
      );

      expect(error).to.equal(openFailure);
      expect(events).to.eql(['keyboard.bind', 'open', 'keyboard.dispose', 'close']);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('preserves browser-open failure when screen failure is already queued', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const openFailure = new Error('open failed');
    const screenFailure = new Error('screen failed');
    let closeCalls = 0;

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
            bindKeyboard: () => undefined,
            createScreen: () => ({
              failure: Promise.reject(screenFailure),
              dispose() {},
            }),
            open: () => {
              throw openFailure;
            },
          },
        })
      );

      expect(error).to.equal(openFailure);
      expect(closeCalls).to.eql(1);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('closes the host when responsive screen reporting fails', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const screenFailure = new Error('screen failed');
    let closeCalls = 0;

    try {
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(cwd),
          deps: {
            materialize: () => Promise.resolve(fakeGeneration()),
            start: () =>
              Promise.resolve(startedFixture({
                finished: new Promise<void>(() => {}),
                close: () => {
                  closeCalls += 1;
                  return Promise.resolve();
                },
              })),
            bindKeyboard: () => undefined,
            createScreen: () => ({
              failure: Promise.reject(screenFailure),
              dispose() {},
            }),
            open: () => undefined,
          },
        })
      );

      expect(error).to.equal(screenFailure);
      expect(closeCalls).to.eql(1);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('propagates keyboard-bind failure without opening a browser', async () => {
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

      expect(error).to.equal(bindFailure);
      expect(openCalls).to.eql(0);
      expect(closeCalls).to.eql(1);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('retains cleanup failure as secondary evidence without replacing the primary failure', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const primary = new Error('open failed');
    const cleanup = new Error('close failed');
    let closeCalls = 0;

    try {
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(cwd),
          deps: {
            materialize: () => Promise.resolve(fakeGeneration()),
            start: () =>
              Promise.resolve(startedFixture({
                finished: new Promise<void>(() => undefined),
                close: () => {
                  closeCalls += 1;
                  return Promise.reject(cleanup);
                },
              })),
            bindKeyboard: () => undefined,
            open: () => {
              throw primary;
            },
          },
        })
      );

      expect(error).to.equal(primary);
      expect((error as Error & { cleanup?: unknown }).cleanup).to.equal(cleanup);
      expect(closeCalls).to.eql(1);
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
          bindKeyboard: () => undefined,
        },
      });

      await startedSignal.promise;
      aborted.abort('test abort');
      await run;

      expect(materializeUntil).to.equal(aborted.signal);
      expect(startUntil).to.equal(aborted.signal);
      expect(closeReasons).to.eql(['lower.until']);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('closes once after an unmodified Arrow Left and ignores other keys', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const serverFinished = deferred();
    const closeReasons: unknown[] = [];
    let disposeCalls = 0;
    let onKey: NonNullable<Parameters<typeof Cli.Keyboard.bind>[0]['onKey']> | undefined;
    const bound = deferred();
    const keyboard: Keyboard = {
      dispose: () => {
        disposeCalls += 1;
      },
      finished: new Promise<void>(() => undefined),
    };

    try {
      const run = start({
        cwd: asProfileRoot(cwd),
        deps: {
          materialize: () => Promise.resolve(fakeGeneration()),
          start: () =>
            Promise.resolve(startedFixture({
              finished: serverFinished.promise,
              close: (reason) => {
                closeReasons.push(reason);
                serverFinished.resolve();
                return Promise.resolve();
              },
            })),
          open: () => undefined,
          bindKeyboard: (input) => {
            onKey = input.onKey;
            bound.resolve();
            return keyboard;
          },
        },
      });

      await bound.promise;
      if (!onKey) throw new Error('Expected start:gui keyboard key callback.');
      await onKey(keypress('right'));
      await onKey(keypress('left', { altKey: true }));
      await onKey(keypress('left', { ctrlKey: true }));
      await onKey(keypress('left', { metaKey: true }));
      await onKey(keypress('left', { shiftKey: true }));
      expect(closeReasons).to.eql([]);
      await onKey(keypress('left'));
      await run;

      expect(closeReasons).to.eql(['start:gui.keyboard.back']);
      expect(disposeCalls).to.eql(1);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('closes once after keyboard quit and disposes the binding', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const serverFinished = deferred();
    let closeCalls = 0;
    let disposeCalls = 0;
    let onQuit: (() => void | Promise<void>) | undefined;
    const bound = deferred();
    const keyboard: Keyboard = {
      dispose: () => {
        disposeCalls += 1;
      },
      finished: new Promise<void>(() => undefined),
    };

    try {
      const run = start({
        cwd: asProfileRoot(cwd),
        deps: {
          materialize: () => Promise.resolve(fakeGeneration()),
          start: () => {
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
            onQuit = input.onQuit;
            bound.resolve();
            return keyboard;
          },
        },
      });

      await bound.promise;
      if (!onQuit) throw new Error('Expected start:gui keyboard quit callback.');
      await onQuit();
      await run;

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
      expect(openCalls).to.eql(0);
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

  it('materializes, hosts, fetches, and closes an opaque loopback Dist', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const temporary = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const cwd = (await Fs.realPath(temporary)) as t.StringDir;
    const fixture = await loopbackDistFixture();
    let started: Started | undefined;
    let opened = 0;
    let body = '';
    let visit: Promise<void> | undefined;
    const failures: unknown[] = [];

    try {
      await start({
        cwd: asProfileRoot(cwd),
        source: {
          manifestUrl: fixture.manifestUrl,
          integrity: fixture.integrity,
          expectedPkg: fixture.expectedPkg,
        },
        deps: {
          start: async (args) => {
            started = await DistServer.start({
              ...args,
              integrity: fixture.integrity,
              silent: true,
            });
            return started;
          },
          bindKeyboard: () => undefined,
          open: (_cwd, origin) => {
            opened += 1;
            visit = (async () => {
              const response = await fetch(origin);
              expect(response.status).to.eql(200);
              body = await response.text();
              await started?.close('driver-pi.start-gui.capstone');
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
