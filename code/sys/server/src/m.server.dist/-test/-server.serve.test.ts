import { describe, expect, Fs, it, type t, WebFixture } from '../../-test.ts';
import { setup, teardown, verified } from '../../-test/u.fixture.dist.ts';
import type { DistServeScreen as TDistServeScreen } from '../u.server.screen/t.ts';
import { D, serveLocalWith, serveWith, startLocalWith, startWith } from '../u.server.start/mod.ts';
import {
  capture,
  type CapturedStartInput,
  catchStart,
  createInteractiveEffects,
  createModeEffects,
  createStarted,
  keypress,
  listenerSettled,
  runInteractiveServe,
  runNestedServe,
  type StartedController,
} from './u.fixture.serve.ts';

type ScreenCreateArgs = TDistServeScreen.CreateArgs;

function createObservedNestedEffects(renderedAt: t.UnixTimestamp) {
  const keyboard = Promise.withResolvers<t.Cli.Keyboard.Bind.Options>();
  const screen = Promise.withResolvers<ScreenCreateArgs>();
  const keyboardFinished = Promise.withResolvers<void>();
  let keyboardDisposals = 0;
  let screenDisposals = 0;

  return {
    effects: {
      bindKeyboard(options: t.Cli.Keyboard.Bind.Options) {
        keyboard.resolve(options);
        return {
          finished: keyboardFinished.promise,
          dispose() {
            keyboardDisposals += 1;
            keyboardFinished.resolve();
          },
        };
      },
      createScreen(args: ScreenCreateArgs) {
        screen.resolve(args);
        return {
          failure: new Promise<never>(() => {}),
          redraw() {},
          dispose() {
            screenDisposals += 1;
          },
        };
      },
      isInteractive: () => true,
      open: () => {},
      now: () => renderedAt,
    },
    keyboard: keyboard.promise,
    screen: screen.promise,
    disposals: () => ({ keyboard: keyboardDisposals, screen: screenDisposals }),
  } as const;
}

describe('DistServer.serve', () => {
  describe('startup and presentation authority', () => {
    it('uses raw terminal metadata for pinned startup', async () => {
      const fixture = await setup();
      const relativeDir = Fs.Path.relative(Fs.cwd(), fixture.source) as t.StringDir;
      let captured: CapturedStartInput = {};
      let verificationDir: t.StringDir | undefined;
      let started: StartedController | undefined;

      try {
        const running = serveWith(
          {
            dir: relativeDir,
            integrity: fixture.integrity,
            limits: fixture.policy.verification,
            port: 49152,
            silent: false,
            pkgSubpath: '/ui//preview/',
          },
          {
            ...D.DEPS,
            verify: (input) => {
              verificationDir = input.dir;
              return Promise.resolve(verified(fixture));
            },
            startHttp: (_app, input) => {
              captured = capture(input);
              started = createStarted(49152);
              return started.server;
            },
          },
          createModeEffects(false),
        );

        await listenerSettled();
        expect(started).to.be.an('object');
        started?.release();
        await running;

        expect(verificationDir).to.eql(Fs.Path.resolve(relativeDir));
        expect(captured.silent).to.eql(false);
        expect(captured.keyboard).to.eql(true);
        expect(captured.strictPort).to.eql(true);
        expect(captured.pkg).to.eql(fixture.cloneDist().pkg);
        expect(captured.hash).to.eql(fixture.cloneDist().hash.digest);
        expect(captured.info).to.eql({ authority: `pinned ${fixture.integrity}` });
        expect(captured.hasPkgSubpath).to.eql(false);
      } finally {
        started?.release();
        await teardown(fixture);
      }
    });

    it('rejects invalid presentation input before either verification authority', async () => {
      const fixture = await setup();
      let pinnedVerifies = 0;
      let localVerifies = 0;
      let starts = 0;
      const deps = {
        ...D.DEPS,
        verify: () => {
          pinnedVerifies += 1;
          return Promise.resolve(verified(fixture));
        },
        verifyLocal: () => {
          localVerifies += 1;
          return Promise.resolve(verified(fixture));
        },
        startHttp: () => {
          starts += 1;
          throw new Error('listener must not start');
        },
      };

      try {
        const pinned = await catchStart(() =>
          serveWith({
            dir: fixture.source as t.StringDir,
            integrity: fixture.integrity,
            limits: fixture.policy.verification,
            pkgSubpath: '\u001b[2J',
          }, deps)
        );
        const local = await catchStart(() =>
          serveLocalWith({
            dir: fixture.source as t.StringDir,
            limits: fixture.policy.verification,
            pkgSubpath: '\u001b[2J',
          }, deps)
        );

        expect(pinned?.reason).to.eql('invalid-input');
        expect(local?.reason).to.eql('invalid-input');
        expect({ pinnedVerifies, localVerifies, starts }).to.eql({
          pinnedVerifies: 0,
          localVerifies: 0,
          starts: 0,
        });
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects malformed or contradictory navigation before verification or presentation effects', async () => {
      const fixture = await setup();
      let pinnedVerifies = 0;
      let localVerifies = 0;
      let starts = 0;
      let presentationEffects = 0;
      const deps = {
        ...D.DEPS,
        verify: () => {
          pinnedVerifies += 1;
          return Promise.resolve(verified(fixture));
        },
        verifyLocal: () => {
          localVerifies += 1;
          return Promise.resolve(verified(fixture));
        },
        startHttp: () => {
          starts += 1;
          throw new Error('listener must not start');
        },
      };
      const unexpected = () => {
        presentationEffects += 1;
        throw new Error('presentation effect must not be acquired');
      };
      const effects = {
        bindKeyboard: unexpected,
        createScreen: unexpected,
        isInteractive: unexpected,
        open: unexpected,
        now: unexpected,
      };
      const pinnedInput = {
        dir: fixture.source as t.StringDir,
        integrity: fixture.integrity,
        limits: fixture.policy.verification,
        navigation: 'nested',
        silent: false,
      } as unknown as t.DistServer.Serve.NestedArgs;
      const localInput = {
        dir: fixture.source as t.StringDir,
        limits: fixture.policy.verification,
        navigation: 'nested',
        keyboard: undefined,
      } as unknown as t.DistServer.Local.Serve.NestedArgs;
      const undefinedNavigation = {
        dir: fixture.source as t.StringDir,
        limits: fixture.policy.verification,
        navigation: undefined,
      } as unknown as t.DistServer.Local.ServeArgs;

      try {
        const pinned = await catchStart(() => serveWith(pinnedInput, deps, effects));
        const local = await catchStart(() => serveLocalWith(localInput, deps, effects));
        const malformed = await catchStart(() =>
          serveLocalWith(undefinedNavigation, deps, effects)
        );

        expect(pinned?.reason).to.eql('invalid-input');
        expect(local?.reason).to.eql('invalid-input');
        expect(malformed?.reason).to.eql('invalid-input');
        expect({ pinnedVerifies, localVerifies, starts, presentationEffects }).to.eql({
          pinnedVerifies: 0,
          localVerifies: 0,
          starts: 0,
          presentationEffects: 0,
        });
      } finally {
        await teardown(fixture);
      }
    });

    it('refuses nested mode without an interactive terminal before verification', async () => {
      const fixture = await setup();
      let verifies = 0;
      let starts = 0;
      let terminalChecks = 0;
      const unexpected = () => {
        throw new Error('presentation effect must not be acquired');
      };

      try {
        const outcome = await catchStart(() =>
          serveLocalWith(
            {
              dir: fixture.source as t.StringDir,
              limits: fixture.policy.verification,
              navigation: 'nested',
            },
            {
              ...D.DEPS,
              verifyLocal: () => {
                verifies += 1;
                return Promise.resolve(verified(fixture));
              },
              startHttp: () => {
                starts += 1;
                throw new Error('listener must not start');
              },
            },
            {
              bindKeyboard: unexpected,
              createScreen: unexpected,
              isInteractive: () => {
                terminalChecks += 1;
                return false;
              },
              open: unexpected,
              now: unexpected,
            },
          )
        );

        expect(outcome?.reason).to.eql('startup-failure');
        expect({ verifies, starts, terminalChecks }).to.eql({
          verifies: 0,
          starts: 0,
          terminalChecks: 1,
        });
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects accessor and Proxy presentation input without invoking caller authority', async () => {
      const fixture = await setup();
      let pinnedVerifies = 0;
      let localVerifies = 0;
      let starts = 0;
      let getterReads = 0;
      const deps = {
        ...D.DEPS,
        verify: () => {
          pinnedVerifies += 1;
          return Promise.resolve(verified(fixture));
        },
        verifyLocal: () => {
          localVerifies += 1;
          return Promise.resolve(verified(fixture));
        },
        startHttp: () => {
          starts += 1;
          throw new Error('listener must not start');
        },
      };
      const pinnedAccessor = {
        dir: fixture.source as t.StringDir,
        integrity: fixture.integrity,
        limits: fixture.policy.verification,
      };
      const localAccessor = {
        dir: fixture.source as t.StringDir,
        limits: fixture.policy.verification,
      };
      const pinnedTagged = {
        dir: fixture.source as t.StringDir,
        integrity: fixture.integrity,
        limits: fixture.policy.verification,
      };
      const localTagged = {
        dir: fixture.source as t.StringDir,
        limits: fixture.policy.verification,
      };
      Object.defineProperty(pinnedTagged, Symbol.toStringTag, {
        get() {
          getterReads += 1;
          return 'Object';
        },
      });
      Object.defineProperty(localTagged, Symbol.toStringTag, {
        get() {
          getterReads += 1;
          return 'Object';
        },
      });

      let proxyTraps = 0;
      const trap = () => {
        proxyTraps += 1;
        throw new Error('serve input Proxy trap invoked');
      };
      const pinnedProxy = new Proxy(pinnedTagged, {
        get: trap,
        getOwnPropertyDescriptor: trap,
        getPrototypeOf: trap,
        ownKeys: trap,
      });
      const localProxy = new Proxy(localTagged, {});

      try {
        {
          using _properties = WebFixture.Property.mock([
            {
              target: pinnedAccessor,
              key: 'pkgSubpath',
              descriptor: {
                configurable: true,
                enumerable: true,
                get() {
                  getterReads += 1;
                  return 'ui';
                },
              },
            },
            {
              target: localAccessor,
              key: 'pkgSubpath',
              descriptor: {
                configurable: true,
                enumerable: true,
                get() {
                  getterReads += 1;
                  return 'ui';
                },
              },
            },
          ]);
          const outcomes = await Promise.all([
            catchStart(() => serveWith(pinnedAccessor, deps)),
            catchStart(() => serveLocalWith(localAccessor, deps)),
            catchStart(() => serveWith(pinnedTagged, deps)),
            catchStart(() => serveLocalWith(localTagged, deps)),
            catchStart(() => serveWith(pinnedProxy, deps)),
            catchStart(() => serveLocalWith(localProxy, deps)),
          ]);

          expect(outcomes.map((error) => error?.reason)).to.eql([
            'invalid-input',
            'invalid-input',
            'invalid-input',
            'invalid-input',
            'invalid-input',
            'invalid-input',
          ]);
          expect({ pinnedVerifies, localVerifies, starts, getterReads, proxyTraps }).to.eql({
            pinnedVerifies: 0,
            localVerifies: 0,
            starts: 0,
            getterReads: 0,
            proxyTraps: 0,
          });
        }
        expect(Object.getOwnPropertyDescriptor(pinnedAccessor, 'pkgSubpath')).to.eql(undefined);
        expect(Object.getOwnPropertyDescriptor(localAccessor, 'pkgSubpath')).to.eql(undefined);
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects Proxy lifecycle authority across pinned and local start and serve', async () => {
      const fixture = await setup();
      const signal = new AbortController().signal;
      let proxyTraps = 0;
      let getterReads = 0;
      let verifies = 0;
      let listenerStarts = 0;
      let presentation = 0;
      const forward = {
        get(target: object, key: PropertyKey, receiver: object) {
          proxyTraps += 1;
          return Reflect.get(target, key, receiver);
        },
        getOwnPropertyDescriptor(target: object, key: PropertyKey) {
          proxyTraps += 1;
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
        getPrototypeOf(target: object) {
          proxyTraps += 1;
          return Reflect.getPrototypeOf(target);
        },
        ownKeys(target: object) {
          proxyTraps += 1;
          return Reflect.ownKeys(target);
        },
      } satisfies ProxyHandler<object>;
      const trap = () => {
        proxyTraps += 1;
        throw new Error('until Proxy trap invoked');
      };
      const forwarding = new Proxy(signal, forward);
      const revoked = Proxy.revocable(signal, {});
      revoked.revoke();
      const proxyPrototype = Object.create(new Proxy({ subscribe() {} }, forward));
      const proxyArrayPrototype = [signal];
      Object.setPrototypeOf(proxyArrayPrototype, new Proxy(Array.prototype, forward));
      const accessorArray: unknown[] = [];
      Object.defineProperty(accessorArray, '0', {
        enumerable: true,
        get() {
          getterReads += 1;
          return signal;
        },
      });
      const cases: unknown[] = [
        new Proxy(signal, {}),
        forwarding,
        new Proxy(signal, {
          get: trap,
          getOwnPropertyDescriptor: trap,
          getPrototypeOf: trap,
          ownKeys: trap,
        }),
        revoked.proxy,
        [forwarding],
        proxyPrototype,
        proxyArrayPrototype,
        accessorArray,
      ];
      const deps = {
        ...D.DEPS,
        verify: () => {
          verifies += 1;
          return Promise.resolve(verified(fixture));
        },
        verifyLocal: () => {
          verifies += 1;
          return Promise.resolve(verified(fixture));
        },
        startHttp: () => {
          listenerStarts += 1;
          throw new Error('listener must not start');
        },
      };
      const unexpected = () => {
        presentation += 1;
        throw new Error('presentation must not start');
      };
      const effects = {
        bindKeyboard: unexpected,
        createScreen: unexpected,
        isInteractive: () => {
          presentation += 1;
          return true;
        },
        open: unexpected,
        now: unexpected,
      };

      try {
        for (const until of cases) {
          const pinned = {
            dir: fixture.source as t.StringDir,
            integrity: fixture.integrity,
            limits: fixture.policy.verification,
            until,
          };
          const local = {
            dir: fixture.source as t.StringDir,
            limits: fixture.policy.verification,
            until,
          };
          const outcomes = await Promise.all([
            catchStart(() => startWith(pinned, deps)),
            catchStart(() => startLocalWith(local, deps)),
            catchStart(() =>
              serveWith(
                { ...pinned, navigation: 'nested' } as unknown as t.DistServer.Serve.NestedArgs,
                deps,
                effects,
              )
            ),
            catchStart(() =>
              serveLocalWith(
                {
                  ...local,
                  navigation: 'nested',
                } as unknown as t.DistServer.Local.Serve.NestedArgs,
                deps,
                effects,
              )
            ),
          ]);
          expect(outcomes.map((error) => error?.reason)).to.eql([
            'invalid-input',
            'invalid-input',
            'invalid-input',
            'invalid-input',
          ]);
        }
        expect({ proxyTraps, getterReads, verifies, listenerStarts, presentation }).to.eql({
          proxyTraps: 0,
          getterReads: 0,
          verifies: 0,
          listenerStarts: 0,
          presentation: 0,
        });
      } finally {
        await teardown(fixture);
      }
    });

    it('uses local authority metadata in local serve mode', async () => {
      const fixture = await setup();
      let captured: CapturedStartInput = {};
      let started: StartedController | undefined;

      try {
        const running = serveLocalWith(
          {
            dir: fixture.source as t.StringDir,
            limits: fixture.policy.verification,
            port: 49152,
            silent: false,
            pkgSubpath: '/ui//preview/',
          },
          {
            ...D.DEPS,
            verifyLocal: () => Promise.resolve(verified(fixture)),
            startHttp: (_app, input) => {
              captured = capture(input);
              started = createStarted(49152);
              return started.server;
            },
          },
          createModeEffects(false),
        );

        await listenerSettled();
        expect(started).to.be.an('object');
        started?.release();
        await running;

        expect(captured.silent).to.eql(false);
        expect(captured.keyboard).to.eql(true);
        expect(captured.strictPort).to.eql(true);
        expect(captured.info).to.eql({ authority: 'local (UNPINNED)' });
        expect(captured.hasPkgSubpath).to.eql(false);
      } finally {
        started?.release();
        await teardown(fixture);
      }
    });

    it('lets silent mode suppress screen ownership without disabling keyboard lifecycle', async () => {
      const fixture = await setup();
      let captured: CapturedStartInput = {};
      let started: StartedController | undefined;
      const unexpected = () => {
        throw new Error('screen effect should not be acquired');
      };
      try {
        const running = serveLocalWith(
          {
            dir: fixture.source as t.StringDir,
            limits: fixture.policy.verification,
            silent: true,
          },
          {
            ...D.DEPS,
            verifyLocal: () => Promise.resolve(verified(fixture)),
            startHttp: (_app, input) => {
              captured = capture(input);
              started = createStarted(49152);
              return started.server;
            },
          },
          {
            bindKeyboard: unexpected,
            createScreen: unexpected,
            isInteractive: unexpected,
            open: unexpected,
            now: unexpected,
          },
        );

        await listenerSettled();
        started?.release();
        await running;

        expect(captured.silent).to.eql(true);
        expect(captured.keyboard).to.eql(true);
        expect(captured.info).to.eql({ authority: 'local (UNPINNED)' });
      } finally {
        started?.release();
        await teardown(fixture);
      }
    });

    it('keeps raw serve pending until the hosted listener lifecycle closes', async () => {
      const fixture = await setup();
      const started = createStarted(49152);
      const closeRequested = Promise.withResolvers<unknown>();
      const closeFinished = Promise.withResolvers<void>();
      Object.defineProperty(started.server, 'close', {
        configurable: true,
        value: (cause?: unknown) => {
          closeRequested.resolve(cause);
          return closeFinished.promise;
        },
      });

      try {
        const running = serveLocalWith(
          {
            dir: fixture.source as t.StringDir,
            limits: fixture.policy.verification,
            silent: true,
          },
          {
            ...D.DEPS,
            verifyLocal: () => Promise.resolve(verified(fixture)),
            startHttp: () => started.server,
          },
          createModeEffects(false),
        );
        let settled = false;
        void running.then(
          () => (settled = true),
          () => (settled = true),
        );

        await listenerSettled();
        started.release();
        expect(await closeRequested.promise).to.eql('server.finished');
        await Promise.resolve();
        expect(settled).to.eql(false);

        closeFinished.resolve();
        await running;
        expect(settled).to.eql(true);
      } finally {
        started.release();
        closeFinished.resolve();
        await teardown(fixture);
      }
    });

    it('owns interactive keyboard and screen against the actual listener origin', async () => {
      const fixture = await setup();
      const dist = fixture.cloneDist();
      const relativeDir = Fs.Path.relative(Fs.cwd(), fixture.source) as t.StringDir;
      let captured: CapturedStartInput = {};
      let verificationDir: t.StringDir | undefined;
      let started: StartedController | undefined;
      let binding: t.Cli.Keyboard.Bind.Options | undefined;
      let screenArgs: ScreenCreateArgs | undefined;
      let keyboardDisposals = 0;
      let screenDisposals = 0;
      let redraws = 0;
      const opened: t.StringUrl[] = [];
      let finishKeyboard = () => {};
      const keyboardFinished = new Promise<void>((resolve) => {
        finishKeyboard = resolve;
      });

      try {
        const running = serveLocalWith(
          {
            dir: relativeDir,
            limits: fixture.policy.verification,
            port: 0,
            silent: false,
            pkgSubpath: '/ui//preview/',
          },
          {
            ...D.DEPS,
            verifyLocal: (input) => {
              verificationDir = input.dir;
              return Promise.resolve(verified(fixture));
            },
            startHttp: (_app, input) => {
              captured = capture(input);
              started = createStarted(49152);
              return started.server;
            },
          },
          {
            bindKeyboard: (options) => {
              binding = options;
              return {
                finished: keyboardFinished,
                dispose() {
                  keyboardDisposals += 1;
                  finishKeyboard();
                },
              };
            },
            createScreen: (args) => {
              screenArgs = args;
              void binding?.onKey?.(keypress('r', {
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                shiftKey: false,
              }));
              return {
                failure: new Promise<never>(() => {}),
                redraw: () => void (redraws += 1),
                dispose: () => {
                  screenDisposals += 1;
                },
              };
            },
            isInteractive: () => true,
            open: (origin) => {
              opened.push(origin);
            },
            now: () => dist.build.time,
          },
        );

        await listenerSettled();
        if (!started || !binding || !screenArgs) {
          throw new Error('interactive effects not acquired');
        }

        expect(captured.silent).to.eql(true);
        expect(captured.keyboard).to.eql(false);
        expect(captured.info).to.eql(undefined);
        expect(binding.until).to.eql(undefined);
        expect(binding.exit).to.eql(false);
        expect(screenArgs.origin).to.eql('http://127.0.0.1:49152/');
        expect(verificationDir).to.eql(Fs.Path.resolve(relativeDir));
        expect(screenArgs.dir).to.eql(relativeDir);
        expect(screenArgs.manifestHref?.href).to.eql(
          Fs.Path.toFileUrl(Fs.Path.join(Fs.Path.resolve(relativeDir), 'dist.json')).href,
        );
        expect(screenArgs.identity).to.eql({
          root: screenArgs.evidence.dist.pkg,
          subpath: 'ui/preview',
        });
        expect(screenArgs).to.not.have.property('pkg');
        expect(screenArgs).to.not.have.property('pkgSubpath');
        expect(screenArgs.authority.kind).to.eql('local-unpinned');
        expect(screenArgs.evidence).to.equal(started.server.verification);
        expect(screenArgs.keyboard).to.eql({ enabled: true, print: true });
        expect(screenArgs.renderedAt).to.eql(dist.build.time);

        const exactRedraw = {
          altKey: false,
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
        } as const;
        await binding.onKey?.(keypress('o'));
        await binding.onKey?.(keypress('r'));
        await binding.onKey?.(keypress('r', { ...exactRedraw, ctrlKey: true }));
        await binding.onKey?.(keypress('r', { ...exactRedraw, altKey: true }));
        await binding.onKey?.(keypress('r', { ...exactRedraw, metaKey: true }));
        await binding.onKey?.(keypress('r', { ...exactRedraw, shiftKey: true }));
        await binding.onKey?.(keypress('R', exactRedraw));
        await binding.onKey?.(keypress('r', exactRedraw));
        await binding.onKey?.(keypress('x'));
        await binding.onKey?.(keypress('r', exactRedraw));
        await binding.onKey?.(keypress('o'));
        expect(opened).to.eql([
          'http://127.0.0.1:49152/',
          'http://127.0.0.1:49152/',
        ]);
        expect(redraws).to.eql(2);
        expect(started.closeCauses).to.eql([]);

        await binding.onQuit();
        await running;
        await binding.onKey?.(keypress('r', exactRedraw));
        expect(started.closeCauses).to.eql(['keyboard']);
        expect(redraws).to.eql(2);
        expect(screenDisposals).to.eql(1);
        expect(keyboardDisposals).to.eql(1);
      } finally {
        started?.release();
        await teardown(fixture);
      }
    });
  });

  describe('nested navigation', () => {
    it('serves pinned nested authority with a finite closed result', async () => {
      const fixture = await setup();
      const started = createStarted(49152);
      const terminal = createInteractiveEffects(fixture);

      try {
        const running = serveWith(
          {
            dir: fixture.source as t.StringDir,
            integrity: fixture.integrity,
            limits: fixture.policy.verification,
            navigation: 'nested',
          },
          {
            ...D.DEPS,
            verify: () => Promise.resolve(verified(fixture)),
            startHttp: () => started.server,
          },
          terminal.effects,
        );
        await listenerSettled();
        started.release();

        expect(await running).to.eql({ kind: 'closed' });
        expect(terminal.disposals()).to.eql({ keyboard: 1, screen: 1 });
      } finally {
        started.release();
        await teardown(fixture);
      }
    });

    it('fails instead of degrading when keyboard binding is unavailable', async () => {
      const fixture = await setup();
      let started: StartedController | undefined;
      let screens = 0;
      let opens = 0;

      try {
        const outcome = await catchStart(() =>
          serveLocalWith(
            {
              dir: fixture.source as t.StringDir,
              limits: fixture.policy.verification,
              navigation: 'nested',
            },
            {
              ...D.DEPS,
              verifyLocal: () => Promise.resolve(verified(fixture)),
              startHttp: () => {
                started = createStarted(49152);
                return started.server;
              },
            },
            {
              bindKeyboard: () => undefined,
              createScreen: () => {
                screens += 1;
                throw new Error('screen must not be acquired');
              },
              isInteractive: () => true,
              open: () => void (opens += 1),
              now: () => fixture.cloneDist().build.time,
            },
          )
        );

        expect(outcome?.reason).to.eql('startup-failure');
        expect(started?.closeCauses).to.eql([outcome]);
        expect({ screens, opens }).to.eql({ screens: 0, opens: 0 });
      } finally {
        started?.release();
        await teardown(fixture);
      }
    });

    it('returns back only after listener and presentation settlement', async () => {
      const fixture = await setup();
      const started = createStarted(49152);
      const closeFinished = Promise.withResolvers<void>();
      const keyboardFinished = Promise.withResolvers<void>();
      const closeCauses: unknown[] = [];
      const disposals: string[] = [];
      const opened: t.StringUrl[] = [];
      let binding: t.Cli.Keyboard.Bind.Options | undefined;
      let screenArgs: ScreenCreateArgs | undefined;
      Object.defineProperty(started.server, 'close', {
        configurable: true,
        value: (cause?: unknown) => {
          closeCauses.push(cause);
          return closeFinished.promise;
        },
      });

      try {
        const running = runNestedServe(fixture, started, {
          bindKeyboard: (options) => {
            binding = options;
            return {
              finished: keyboardFinished.promise,
              dispose() {
                disposals.push('keyboard');
                keyboardFinished.resolve();
              },
            };
          },
          createScreen: (args) => {
            screenArgs = args;
            return {
              failure: new Promise<never>(() => {}),
              redraw() {},
              dispose() {
                disposals.push('screen');
              },
            };
          },
          isInteractive: () => true,
          open: (origin) => void opened.push(origin),
          now: () => fixture.cloneDist().build.time,
        });
        let settled = false;
        void running.then(
          () => (settled = true),
          () => (settled = true),
        );
        await listenerSettled();
        if (!binding || !screenArgs) throw new Error('nested presentation effects not acquired');

        expect(screenArgs.keyboard).to.eql({
          enabled: true,
          print: true,
          navigation: 'nested',
        });
        expect(binding.exit).to.eql(false);

        const modifiedBack = await binding.onKey?.(keypress('left', {
          altKey: false,
          ctrlKey: true,
          metaKey: false,
          shiftKey: true,
        }));
        await listenerSettled();
        expect(modifiedBack).to.eql(undefined);
        expect(closeCauses).to.eql([]);

        await binding.onKey?.(keypress('o'));
        expect(opened).to.eql(['http://127.0.0.1:49152/']);

        const backing = Promise.resolve(
          binding.onKey?.(keypress('left', {
            altKey: false,
            ctrlKey: true,
            metaKey: false,
            shiftKey: false,
          })),
        );
        await listenerSettled();
        expect(closeCauses).to.eql(['keyboard.back']);
        expect(settled).to.eql(false);

        closeFinished.resolve();
        await listenerSettled();
        expect(settled).to.eql(false);

        started.release();
        expect(await backing).to.eql('stop');
        expect(await running).to.eql({ kind: 'back' });
        expect(disposals).to.eql(['screen', 'keyboard']);
        expect(settled).to.eql(true);

        await binding.onQuit();
        expect(closeCauses).to.eql(['keyboard.back']);
      } finally {
        closeFinished.resolve();
        keyboardFinished.resolve();
        started.release();
        await teardown(fixture);
      }
    });

    it('revokes back success when presentation cleanup fails', async () => {
      const fixture = await setup();
      const started = createStarted(49152);
      const keyboardFinished = Promise.withResolvers<void>();
      const cause = new Error('nested-screen-cleanup-failed');
      let binding: t.Cli.Keyboard.Bind.Options | undefined;

      try {
        const running = runNestedServe(fixture, started, {
          bindKeyboard: (options) => {
            binding = options;
            return {
              finished: keyboardFinished.promise,
              dispose: () => keyboardFinished.resolve(),
            };
          },
          createScreen: () => ({
            failure: new Promise<never>(() => {}),
            redraw() {},
            dispose() {
              throw cause;
            },
          }),
          isInteractive: () => true,
          open: () => {},
          now: () => fixture.cloneDist().build.time,
        });
        await listenerSettled();
        if (!binding) throw new Error('nested keyboard binding not acquired');

        const disposition = await binding.onKey?.(keypress('left', {
          altKey: false,
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
        }));
        const outcome = await running.then(
          () => ({ rejected: false, cause: undefined }),
          (error) => ({ rejected: true, cause: error }),
        );

        expect(disposition).to.eql('stop');
        expect(outcome).to.eql({ rejected: true, cause });
        expect(started.closeCauses).to.eql(['keyboard.back']);
      } finally {
        keyboardFinished.resolve();
        started.release();
        await teardown(fixture);
      }
    });

    it('returns closed for every non-back terminal source and ignores late back', async () => {
      const fixture = await setup();

      try {
        for (const source of ['listener', 'quit', 'keyboard'] as const) {
          const started = createStarted(49152);
          const keyboardFinished = Promise.withResolvers<void>();
          let binding: t.Cli.Keyboard.Bind.Options | undefined;
          let screenDisposals = 0;
          let keyboardDisposals = 0;
          const running = runNestedServe(fixture, started, {
            bindKeyboard: (options) => {
              binding = options;
              return {
                finished: keyboardFinished.promise,
                dispose() {
                  keyboardDisposals += 1;
                  keyboardFinished.resolve();
                },
              };
            },
            createScreen: () => ({
              failure: new Promise<never>(() => {}),
              redraw() {},
              dispose() {
                screenDisposals += 1;
              },
            }),
            isInteractive: () => true,
            open: () => {},
            now: () => fixture.cloneDist().build.time,
          });
          await listenerSettled();
          if (!binding) throw new Error('nested keyboard binding not acquired');

          if (source === 'listener') started.release();
          if (source === 'quit') await binding.onQuit();
          if (source === 'keyboard') keyboardFinished.resolve();
          expect(await running).to.eql({ kind: 'closed' });
          expect({ keyboardDisposals, screenDisposals }).to.eql({
            keyboardDisposals: 1,
            screenDisposals: 1,
          });
          expect(started.closeCauses).to.eql(
            source === 'listener' ? [] : [source === 'quit' ? 'keyboard' : 'keyboard.finished'],
          );

          expect(
            await binding.onKey?.(keypress('left', {
              altKey: false,
              ctrlKey: true,
              metaKey: false,
              shiftKey: false,
            })),
          ).to.eql('stop');
          expect(started.closeCauses).to.eql(
            source === 'listener' ? [] : [source === 'quit' ? 'keyboard' : 'keyboard.finished'],
          );
        }
      } finally {
        await teardown(fixture);
      }
    });

    it('reverifies on re-entry and immediately reuses the released strict port', async () => {
      const fixture = await setup();
      const origins: t.StringUrl[] = [];
      const requestedPorts: (t.PortNumber | undefined)[] = [];
      const strictPorts: (boolean | undefined)[] = [];
      const listeners: StartedController[] = [];
      let acquireKeyboard: ((options: t.Cli.Keyboard.Bind.Options) => void) | undefined;
      let bound = false;
      let verifies = 0;
      const deps = {
        ...D.DEPS,
        verifyLocal: (input: t.FsPkg.Dist.Local.Verify.Args) => {
          verifies += 1;
          return D.DEPS.verifyLocal(input);
        },
        startHttp: (
          _app: t.HttpServer.App,
          input: t.HttpServer.Start.Options,
        ) => {
          if (bound) throw new Error('listener port was not released before re-entry');
          bound = true;
          requestedPorts.push(input.port);
          strictPorts.push(input.strictPort);
          const started = createStarted(input.port === 0 ? 49152 : input.port ?? 49152);
          const close = started.server.close;
          Object.defineProperty(started.server, 'close', {
            configurable: true,
            value: async (cause?: unknown) => {
              try {
                await close(cause);
              } finally {
                bound = false;
              }
            },
          });
          listeners.push(started);
          return started.server;
        },
      };
      const effects = {
        bindKeyboard: (options: t.Cli.Keyboard.Bind.Options) => {
          acquireKeyboard?.(options);
          const finished = Promise.withResolvers<void>();
          return {
            finished: finished.promise,
            dispose: () => finished.resolve(),
          };
        },
        createScreen: (args: ScreenCreateArgs) => {
          origins.push(args.origin);
          return {
            failure: new Promise<never>(() => {}),
            redraw() {},
            dispose() {},
          };
        },
        isInteractive: () => true,
        open: () => {},
        now: () => fixture.cloneDist().build.time,
      };
      const serveOnce = async (port: t.PortNumber) => {
        const acquired = Promise.withResolvers<t.Cli.Keyboard.Bind.Options>();
        acquireKeyboard = acquired.resolve;
        const running = serveLocalWith(
          {
            dir: fixture.source as t.StringDir,
            limits: fixture.policy.verification,
            navigation: 'nested',
            port,
          },
          deps,
          effects,
        );
        const outcome = running.then(
          (value) => ({ ok: true, value } as const),
          (cause) => ({ ok: false, cause } as const),
        );
        const first = await Promise.race([
          acquired.promise.then((binding) => ({ kind: 'binding', binding } as const)),
          outcome.then((settled) => ({ kind: 'outcome', settled } as const)),
        ]);
        if (first.kind === 'outcome') {
          if (!first.settled.ok) throw first.settled.cause;
          throw new Error('nested keyboard binding not acquired');
        }
        const { binding } = first;
        expect(
          await binding.onKey?.(keypress('left', {
            altKey: false,
            ctrlKey: true,
            metaKey: false,
            shiftKey: false,
          })),
        ).to.eql('stop');
        const settled = await outcome;
        acquireKeyboard = undefined;
        if (!settled.ok) throw settled.cause;
        return settled.value;
      };

      try {
        expect(await serveOnce(0 as t.PortNumber)).to.eql({ kind: 'back' });
        expect(await serveOnce(49152 as t.PortNumber)).to.eql({ kind: 'back' });

        expect(verifies).to.eql(2);
        expect(requestedPorts).to.eql([0, 49152]);
        expect(strictPorts).to.eql([true, true]);
        expect(origins).to.eql([
          'http://127.0.0.1:49152/',
          'http://127.0.0.1:49152/',
        ]);
        expect(bound).to.eql(false);
      } finally {
        for (const listener of listeners) listener.release();
        await teardown(fixture);
      }
    });

    it('settles caller cancellation before reusing the real listener port', async () => {
      const fixture = await setup();
      const firstController = new AbortController();
      const secondController = new AbortController();
      let first: Promise<t.DistServer.Serve.Result> | undefined;
      let second: Promise<t.DistServer.Serve.Result> | undefined;

      try {
        const firstSession = createObservedNestedEffects(fixture.cloneDist().build.time);
        first = serveLocalWith(
          {
            dir: fixture.source as t.StringDir,
            limits: fixture.policy.verification,
            navigation: 'nested',
            port: 0 as t.PortNumber,
            until: firstController.signal,
          },
          D.DEPS,
          firstSession.effects,
        );
        const [firstKeyboard, firstScreen] = await Promise.all([
          firstSession.keyboard,
          firstSession.screen,
        ]);
        expect(firstKeyboard).to.be.an('object');
        const initial = await fetch(firstScreen.origin);
        expect(initial.status).to.eql(200);
        await initial.body?.cancel();

        const port = Number(new URL(firstScreen.origin).port) as t.PortNumber;
        expect(Number.isSafeInteger(port) && port > 0).to.eql(true);
        firstController.abort('test.cancel');
        expect(await first).to.eql({ kind: 'closed' });
        expect(firstSession.disposals()).to.eql({ keyboard: 1, screen: 1 });

        const secondSession = createObservedNestedEffects(fixture.cloneDist().build.time);
        second = serveLocalWith(
          {
            dir: fixture.source as t.StringDir,
            limits: fixture.policy.verification,
            navigation: 'nested',
            port,
            until: secondController.signal,
          },
          D.DEPS,
          secondSession.effects,
        );
        const [secondKeyboard, secondScreen] = await Promise.all([
          secondSession.keyboard,
          secondSession.screen,
        ]);
        expect(secondScreen.origin).to.eql(firstScreen.origin);
        const reused = await fetch(secondScreen.origin);
        expect(reused.status).to.eql(200);
        await reused.body?.cancel();

        expect(
          await secondKeyboard.onKey?.(keypress('left', {
            altKey: false,
            ctrlKey: true,
            metaKey: false,
            shiftKey: false,
          })),
        ).to.eql('stop');
        expect(await second).to.eql({ kind: 'back' });
        expect(secondSession.disposals()).to.eql({ keyboard: 1, screen: 1 });
      } finally {
        firstController.abort('test.cleanup');
        secondController.abort('test.cleanup');
        await first?.catch(() => {});
        await second?.catch(() => {});
        await teardown(fixture);
      }
    });

    it('preserves a screen-first failure against a late back input', async () => {
      const fixture = await setup();
      const started = createStarted(49152);
      const keyboardFinished = Promise.withResolvers<void>();
      const screenFailure = Promise.withResolvers<never>();
      const cause = new Error('nested-screen-failed');
      let binding: t.Cli.Keyboard.Bind.Options | undefined;

      try {
        const running = runNestedServe(fixture, started, {
          bindKeyboard: (options) => {
            binding = options;
            return {
              finished: keyboardFinished.promise,
              dispose: () => keyboardFinished.resolve(),
            };
          },
          createScreen: () => ({
            failure: screenFailure.promise,
            redraw() {},
            dispose() {},
          }),
          isInteractive: () => true,
          open: () => {},
          now: () => fixture.cloneDist().build.time,
        });
        await listenerSettled();
        if (!binding) throw new Error('nested keyboard binding not acquired');

        screenFailure.reject(cause);
        const outcome = await running.then(
          () => ({ rejected: false, cause: undefined }),
          (error) => ({ rejected: true, cause: error }),
        );
        expect(outcome).to.eql({ rejected: true, cause });
        expect(started.closeCauses).to.eql([cause]);

        expect(
          await binding.onKey?.(keypress('left', {
            altKey: false,
            ctrlKey: true,
            metaKey: false,
            shiftKey: false,
          })),
        ).to.eql('stop');
        expect(started.closeCauses).to.eql([cause]);
      } finally {
        keyboardFinished.resolve();
        started.release();
        await teardown(fixture);
      }
    });
  });

  describe('interactive lifecycle', () => {
    it('closes when an acquired keyboard finishes before the server', async () => {
      const fixture = await setup();
      const started = createStarted(49152);
      const terminal = createInteractiveEffects(fixture);
      try {
        const running = runInteractiveServe(fixture, started, terminal.effects);
        await listenerSettled();
        terminal.finishKeyboard();
        await running;

        expect(started.closeCauses).to.eql(['keyboard.finished']);
        expect(terminal.disposals()).to.eql({ keyboard: 1, screen: 1 });
      } finally {
        started.release();
        await teardown(fixture);
      }
    });

    it('surfaces shutdown failure after an acquired keyboard finishes', async () => {
      const fixture = await setup();
      const closeFailure = new Error('keyboard-shutdown-failed');
      const started = createStarted(49152, { closeFailure });
      const terminal = createInteractiveEffects(fixture);
      try {
        const running = runInteractiveServe(fixture, started, terminal.effects);
        await listenerSettled();
        terminal.finishKeyboard();
        const outcome = await running.then(
          () => ({ rejected: false, cause: undefined }),
          (cause) => ({ rejected: true, cause }),
        );

        expect(outcome).to.eql({ rejected: true, cause: closeFailure });
        expect(started.closeCauses).to.eql(['keyboard.finished']);
        expect(terminal.disposals()).to.eql({ keyboard: 1, screen: 1 });
      } finally {
        started.release();
        await teardown(fixture);
      }
    });

    it('retains quit shutdown failure after the listener settles first', async () => {
      const fixture = await setup();
      const closeFailure = new Error('keyboard-quit-shutdown-failed');
      const started = createStarted(49152, { closeFailure, finishBeforeCloseFailure: true });
      const terminal = createInteractiveEffects(fixture);
      try {
        const running = runInteractiveServe(fixture, started, terminal.effects);
        await listenerSettled();
        const quitting = Promise.resolve(terminal.quit()).then(
          () => ({ rejected: false, cause: undefined }),
          (cause) => ({ rejected: true, cause }),
        );
        const outcome = await running.then(
          () => ({ rejected: false, cause: undefined }),
          (cause) => ({ rejected: true, cause }),
        );

        expect(await quitting).to.eql({ rejected: true, cause: closeFailure });
        expect(outcome).to.eql({ rejected: true, cause: closeFailure });
        expect(started.closeCauses).to.eql(['keyboard']);
        expect(terminal.disposals()).to.eql({ keyboard: 1, screen: 1 });
      } finally {
        started.release();
        await teardown(fixture);
      }
    });

    it('disposes the keyboard without relabeling server-first completion', async () => {
      const fixture = await setup();
      const started = createStarted(49152);
      const terminal = createInteractiveEffects(fixture);
      try {
        const running = runInteractiveServe(fixture, started, terminal.effects);
        await listenerSettled();
        started.release();
        await running;

        expect(started.closeCauses).to.eql([]);
        expect(terminal.disposals()).to.eql({ keyboard: 1, screen: 1 });
      } finally {
        started.release();
        await teardown(fixture);
      }
    });

    it('keeps serve pending until disposed keyboard listener work terminates', async () => {
      const fixture = await setup();
      const started = createStarted(49152);
      const keyboardFinished = Promise.withResolvers<void>();
      const disposalRequested = Promise.withResolvers<void>();
      let keyboardDisposals = 0;
      const effects = {
        bindKeyboard: () => ({
          finished: keyboardFinished.promise,
          dispose() {
            keyboardDisposals += 1;
            disposalRequested.resolve();
          },
        }),
        createScreen: () => ({
          failure: new Promise<never>(() => undefined),
          redraw() {},
          dispose() {},
        }),
        isInteractive: () => true,
        open: () => {},
        now: () => fixture.cloneDist().build.time,
      };

      try {
        const running = runInteractiveServe(fixture, started, effects);
        let settled = false;
        void running.then(
          () => (settled = true),
          () => (settled = true),
        );
        await listenerSettled();
        started.release();
        await disposalRequested.promise;
        await Promise.resolve();

        expect(settled).to.eql(false);
        expect(keyboardDisposals).to.eql(1);

        keyboardFinished.resolve();
        await running;
        expect(settled).to.eql(true);
      } finally {
        keyboardFinished.resolve();
        started.release();
        await teardown(fixture);
      }
    });
  });

  describe('presentation and failure ownership', () => {
    it('passes one normalized package identity through pinned and local screens', async () => {
      const fixture = await setup();
      const screens: ScreenCreateArgs[] = [];
      let started: StartedController | undefined;
      const effects = {
        bindKeyboard: () => {
          throw new Error('keyboard must remain disabled');
        },
        createScreen: (args: ScreenCreateArgs) => {
          screens.push(args);
          return { failure: new Promise<never>(() => {}), redraw() {}, dispose() {} };
        },
        isInteractive: () => true,
        open: () => {},
        now: () => fixture.cloneDist().build.time,
      };
      const deps = {
        ...D.DEPS,
        verify: () => Promise.resolve(verified(fixture)),
        verifyLocal: () => Promise.resolve(verified(fixture)),
        startHttp: () => {
          started = createStarted(49152);
          return started.server;
        },
      };
      const subpath = '/ui//preview/';
      const relativeDir = Fs.Path.relative(Fs.cwd(), fixture.source) as t.StringDir;

      try {
        const pinned = serveWith(
          {
            dir: relativeDir,
            integrity: fixture.integrity,
            limits: fixture.policy.verification,
            silent: false,
            keyboard: false,
            pkgSubpath: subpath,
          },
          deps,
          effects,
        );
        await listenerSettled();
        started?.release();
        await pinned;

        const local = serveLocalWith(
          {
            dir: fixture.source as t.StringDir,
            limits: fixture.policy.verification,
            silent: false,
            keyboard: false,
            pkgSubpath: subpath,
          },
          deps,
          effects,
        );
        await listenerSettled();
        started?.release();
        await local;

        expect(screens).to.have.length(2);
        expect(screens[0]?.dir).to.eql(relativeDir);
        expect(screens[0]?.manifestHref?.href).to.eql(
          Fs.Path.toFileUrl(Fs.Path.join(Fs.Path.resolve(relativeDir), 'dist.json')).href,
        );
        for (const screen of screens) {
          const identity = screen.identity;
          if (!identity || !('root' in identity)) throw new Error('compound identity not provided');
          expect(identity.root).to.equal(screen.evidence.dist.pkg);
          expect(identity.subpath).to.eql('ui/preview');
        }
      } finally {
        started?.release();
        await teardown(fixture);
      }
    });

    it('rolls back an acquired server without masking screen acquisition failure', async () => {
      const fixture = await setup();
      let started: StartedController | undefined;
      let keyboardDisposals = 0;
      const keyboardFinished = Promise.withResolvers<void>();
      const cause = new Error('screen-acquisition-failed');
      try {
        const outcome = await serveLocalWith(
          {
            dir: fixture.source as t.StringDir,
            limits: fixture.policy.verification,
            silent: false,
          },
          {
            ...D.DEPS,
            verifyLocal: () => Promise.resolve(verified(fixture)),
            startHttp: () => {
              started = createStarted(49152);
              return started.server;
            },
          },
          {
            bindKeyboard: () => ({
              finished: keyboardFinished.promise,
              dispose() {
                keyboardDisposals += 1;
                if (keyboardDisposals === 1) throw new Error('keyboard-cleanup-failed');
                keyboardFinished.resolve();
              },
            }),
            createScreen: () => {
              throw cause;
            },
            isInteractive: () => true,
            open: () => {},
            now: () => fixture.cloneDist().build.time,
          },
        ).then(
          () => ({ rejected: false, cause: undefined }),
          (error) => ({ rejected: true, cause: error }),
        );

        expect(outcome).to.eql({ rejected: true, cause });
        expect(started?.closeCauses).to.eql([cause]);
        expect(keyboardDisposals).to.eql(2);
      } finally {
        started?.release();
        await teardown(fixture);
      }
    });

    it('closes on keyboard failure and preserves it over presentation cleanup failures', async () => {
      const fixture = await setup();
      let started: StartedController | undefined;
      let rejectKeyboard = (_cause: unknown) => {};
      let keyboardDisposals = 0;
      let screenDisposals = 0;
      const keyboardFinished = new Promise<void>((_resolve, reject) => {
        rejectKeyboard = reject;
      });
      const cause = new Error('keyboard-failed');

      try {
        const running = serveLocalWith(
          {
            dir: fixture.source as t.StringDir,
            limits: fixture.policy.verification,
            silent: false,
          },
          {
            ...D.DEPS,
            verifyLocal: () => Promise.resolve(verified(fixture)),
            startHttp: () => {
              started = createStarted(49152);
              return started.server;
            },
          },
          {
            bindKeyboard: () => ({
              finished: keyboardFinished,
              dispose() {
                keyboardDisposals += 1;
                throw new Error('keyboard-cleanup-failed');
              },
            }),
            createScreen: () => ({
              failure: new Promise<never>(() => {}),
              redraw() {},
              dispose() {
                screenDisposals += 1;
                throw new Error('screen-cleanup-failed');
              },
            }),
            isInteractive: () => true,
            open: () => {},
            now: () => fixture.cloneDist().build.time,
          },
        );

        await listenerSettled();
        rejectKeyboard(cause);
        const outcome = await running.then(
          () => ({ rejected: false, cause: undefined }),
          (error) => ({ rejected: true, cause: error }),
        );

        expect(outcome).to.eql({ rejected: true, cause });
        expect(started?.closeCauses).to.eql([cause]);
        expect(screenDisposals).to.eql(1);
        expect(keyboardDisposals).to.eql(2);
      } finally {
        started?.release();
        await teardown(fixture);
      }
    });

    it('closes on redraw failure and preserves it over presentation cleanup failure', async () => {
      const fixture = await setup();
      const started = createStarted(49152);
      const keyboardFinished = Promise.withResolvers<void>();
      const screenFailure = Promise.withResolvers<never>();
      const cause = new Error('redraw-failed');
      let onKey: t.Cli.Keyboard.Bind.Options['onKey'];
      let redraws = 0;
      let screenDisposals = 0;
      let keyboardDisposals = 0;
      let failed = false;
      const effects = {
        bindKeyboard: (options: t.Cli.Keyboard.Bind.Options) => {
          onKey = options.onKey;
          return {
            finished: keyboardFinished.promise,
            dispose() {
              keyboardDisposals += 1;
              keyboardFinished.resolve();
            },
          };
        },
        createScreen: () => ({
          failure: screenFailure.promise,
          redraw() {
            if (failed) return;
            failed = true;
            redraws += 1;
            screenFailure.reject(cause);
          },
          dispose() {
            screenDisposals += 1;
            throw new Error('screen-cleanup-failed');
          },
        }),
        isInteractive: () => true,
        open: () => {},
        now: () => fixture.cloneDist().build.time,
      };

      try {
        const running = runInteractiveServe(fixture, started, effects);
        await listenerSettled();
        if (!onKey) throw new Error('keyboard binding not acquired');
        const redraw = keypress('r', {
          altKey: false,
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
        });
        await onKey(redraw);
        await onKey(redraw);
        const outcome = await running.then(
          () => ({ rejected: false, cause: undefined }),
          (error) => ({ rejected: true, cause: error }),
        );

        await onKey(redraw);
        expect(outcome).to.eql({ rejected: true, cause });
        expect(started.closeCauses).to.eql([cause]);
        expect(redraws).to.eql(1);
        expect(screenDisposals).to.eql(1);
        expect(keyboardDisposals).to.eql(1);
      } finally {
        keyboardFinished.resolve();
        started.release();
        await teardown(fixture);
      }
    });

    it('preserves an undefined-cause server rejection over screen cleanup failure', async () => {
      const fixture = await setup();
      let started: StartedController | undefined;
      let screenDisposals = 0;
      try {
        const running = serveLocalWith(
          {
            dir: fixture.source as t.StringDir,
            limits: fixture.policy.verification,
            keyboard: false,
            silent: false,
          },
          {
            ...D.DEPS,
            verifyLocal: () => Promise.resolve(verified(fixture)),
            startHttp: () => {
              started = createStarted(49152);
              return started.server;
            },
          },
          {
            bindKeyboard: () => {
              throw new Error('keyboard should remain disabled');
            },
            createScreen: () => ({
              failure: new Promise<never>(() => {}),
              redraw() {},
              dispose() {
                screenDisposals += 1;
                throw new Error('screen-cleanup-failed');
              },
            }),
            isInteractive: () => true,
            open: () => {},
            now: () => fixture.cloneDist().build.time,
          },
        );

        await listenerSettled();
        started?.fail(undefined);
        const outcome = await running.then(
          () => ({ rejected: false, cause: undefined }),
          (cause) => ({ rejected: true, cause }),
        );

        expect(outcome).to.eql({ rejected: true, cause: undefined });
        expect(screenDisposals).to.eql(1);
      } finally {
        started?.release();
        await teardown(fixture);
      }
    });

    it('keeps pinned and local serve strict on explicit ports', async () => {
      const fixture = await setup();
      let localStarted: StartedController | undefined;
      try {
        const shared = {
          ...D.DEPS,
          verify: () => Promise.resolve(verified(fixture)),
          verifyLocal: () => Promise.resolve(verified(fixture)),
        };

        const pinnedError = await catchStart(() =>
          serveWith(
            {
              dir: fixture.source as t.StringDir,
              integrity: fixture.integrity,
              limits: fixture.policy.verification,
              port: 8080,
              silent: false,
            },
            {
              ...shared,
              startHttp: () => createStarted(49152).server,
            },
            createModeEffects(false),
          )
        );

        const localError = await catchStart(() =>
          serveLocalWith(
            {
              dir: fixture.source as t.StringDir,
              limits: fixture.policy.verification,
              port: 8080,
              silent: false,
            },
            {
              ...shared,
              startHttp: () => {
                localStarted = createStarted(49152);
                return localStarted.server;
              },
            },
            createModeEffects(false),
          )
        );

        expect(pinnedError?.reason).to.eql('address-in-use');
        expect(localError?.reason).to.eql('address-in-use');
        expect(localStarted?.closeCauses).to.eql(['dist-server.start.failed']);
      } finally {
        localStarted?.release();
        await teardown(fixture);
      }
    });
  });
});
