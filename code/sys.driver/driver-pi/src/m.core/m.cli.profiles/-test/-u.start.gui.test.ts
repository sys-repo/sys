import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { DistServer } from '@sys/server/dist';
import { start, START_GUI_SOURCE } from '../u.start/u.gui.ts';
import {
  asProfileRoot,
  deferred,
  fakeGeneration,
  type Keyboard,
  loopbackDistFixture,
  rejectionOf,
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

    try {
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(cwd),
          deps: {
            materialize: () =>
              Promise.resolve({
                kind: 'failed',
                stage: 'manifest-fetch',
                reason: 'resource-failure',
                cleanup: 'not-needed',
              }),
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
      expect((error as Error & { materialization?: unknown }).materialization).to.eql({
        stage: 'manifest-fetch',
        reason: 'resource-failure',
        cleanup: 'not-needed',
      });
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
    let screenInput: { dir: t.StringDir; origin: t.StringUrl; keyboard: boolean } | undefined;
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

      expect(Object.isFrozen(START_GUI_SOURCE)).to.eql(true);
      expect(materializeArgs?.manifestUrl).to.eql(START_GUI_SOURCE.manifestUrl);
      expect(materializeArgs?.integrity).to.eql(START_GUI_SOURCE.integrity);
      expect(materializeArgs?.storeDir).to.eql(storeDir);
      expect(materializeArgs?.policy.manifest.sourceOrigins).to.eql(['http://localhost:8080']);
      expect(startArgs).to.include({
        dir: '/tmp/driver-pi-gui-generation',
        integrity: START_GUI_SOURCE.integrity,
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
      expect(await Fs.exists(storeDir)).to.eql(true);
      expect(screenInput).to.eql({
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
    const source: t.PiCliProfiles.StartGuiSource = {
      manifestUrl: 'https://gui.example.test:8443/release/dist.json',
      integrity: 'sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
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
            return Promise.resolve(fakeGeneration());
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

  it('rejects malformed source URL and integrity before materialization', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const validIntegrity =
      'sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as t.StringHash;
    const cases: Array<{ source: t.PiCliProfiles.StartGuiSource; message: string }> = [
      {
        source: { manifestUrl: 'file:///tmp/dist.json', integrity: validIntegrity },
        message: 'Invalid start:gui manifest URL.',
      },
      {
        source: { manifestUrl: 'https://gui.example.test/dist.json', integrity: 'sha256-invalid' },
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

  it('materializes, hosts, fetches, and closes an opaque loopback Dist', async () => {
    const prefix = 'driver-pi.profiles.u.start.gui.test.';
    const temporary = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const cwd = (await Fs.realPath(temporary)) as t.StringDir;
    const fixture = await loopbackDistFixture();
    let started: Started | undefined;
    let opened = 0;
    let body = '';
    let visit: Promise<void> | undefined;

    try {
      await start({
        cwd: asProfileRoot(cwd),
        source: {
          manifestUrl: fixture.manifestUrl,
          integrity: fixture.integrity,
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
    } finally {
      await fixture.dispose();
      await Fs.remove(cwd);
    }
  });
});
