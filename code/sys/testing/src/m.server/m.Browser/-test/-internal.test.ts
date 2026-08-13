import type { Process as TProcess } from '@sys/process/t';
import { describe, expect, it, Time } from '../../-test.ts';
import type { t } from '../common.ts';
import { chromeArgs, launchModes, sanitizeChromeOutput, startChrome } from '../u.chrome.launch.ts';
import {
  guardChromeTargetOrigin,
  navigateChromeTarget,
  reloadChromeTarget,
} from '../u.chrome.protocol.ts';
import {
  closeChromeSession,
  combinePrimaryAndCleanup,
  connectCdpWithRetry,
} from '../u.chrome.session.ts';

const sandboxBypasses = ['--no-sandbox', '--disable-setuid-sandbox', '--no-zygote'] as const;

describe('Browser Chrome lifecycle policy', () => {
  it('launch arguments → preserve browser sandbox and isolate the profile', () => {
    const mode = launchModes()[0];
    const userDataDir = '/tmp/sys-testing-profile-secret';
    const args = chromeArgs({ mode, userDataDir });

    expect(args).to.contain(mode.headlessArg);
    expect(args).to.contain(`--user-data-dir=${userDataDir}`);
    expect(args).to.contain('--remote-debugging-address=127.0.0.1');
    expect(args).to.contain('--remote-debugging-port=0');
    sandboxBypasses.forEach((flag) => expect(args.includes(flag)).to.eql(false));
  });

  it('startup diagnostics → redact the exact profile across custom temp shapes', () => {
    const secret = '/home/runner/work/_temp/custom profile/sys-testing-chrome-secret';
    const text = sanitizeChromeOutput(
      `failed --user-data-dir="${secret}" ${secret} file://${secret} /tmp/sys-testing-secret`,
      secret,
    );

    expect(text.includes(secret)).to.eql(false);
    expect(text.includes('/tmp/sys-testing-secret')).to.eql(false);
    expect(text).to.contain('--user-data-dir=<redacted>');
    expect(text).to.contain('<temporary-profile>');
    expect(text).to.contain('<temporary-path>');
  });

  it('CDP retry → respects one bounded connection deadline', async () => {
    const started = Time.now.timestamp;
    let attempts = 0;
    let caught: unknown;
    try {
      await connectCdpWithRetry(
        'ws://127.0.0.1:1/devtools/browser/test',
        async (_url, timeout) => {
          attempts += 1;
          await Time.wait((timeout ?? 1) + 10);
          throw new Error('silent endpoint');
        },
        40,
      );
    } catch (cause) {
      caught = cause;
    }

    expect(caught).to.be.instanceOf(Error);
    expect(attempts).to.eql(1);
    expect(Time.now.timestamp - started < 250).to.eql(true);
  });

  it('navigation correlation → ignores stale main-frame events from an earlier loader', async () => {
    let emit: ((message: t.Browser.Chrome.Cdp.Message) => void) | undefined;
    let navigateReturned = false;
    const cdp = protocolStub({
      on(handler) {
        emit = handler;
        return () => undefined;
      },
      async send<T = Record<string, unknown>>(method: string) {
        if (method !== 'Page.navigate') return {} as T;
        emit?.({
          method: 'Page.lifecycleEvent',
          sessionId: 'session',
          params: { frameId: 'main', loaderId: 'stale-loader', name: 'load' },
        });
        navigateReturned = true;
        setTimeout(() => {
          emit?.({
            method: 'Page.lifecycleEvent',
            sessionId: 'session',
            params: { frameId: 'main', loaderId: 'current-loader', name: 'load' },
          });
        }, 20);
        return { loaderId: 'current-loader' } as T;
      },
    });

    await navigateChromeTarget(cdp, 'session', 'main', 'http://127.0.0.1/', 500);
    expect(navigateReturned).to.eql(true);
  });

  it('reload correlation → requires a new main-frame load lifecycle', async () => {
    let predicate: ((message: t.Browser.Chrome.Cdp.Message) => boolean) | undefined;
    const waiter = Promise.resolve({
      method: 'Page.lifecycleEvent',
      sessionId: 'session',
      params: { frameId: 'main', loaderId: 'current-loader', name: 'load' },
    }) as t.Browser.Chrome.Cdp.Waiter;
    Object.defineProperty(waiter, 'cancel', { value: () => undefined });
    let frameReads = 0;
    const cdp = protocolStub({
      async send<T = Record<string, unknown>>(method: string) {
        if (method === 'Page.getFrameTree') {
          frameReads += 1;
          const loaderId = frameReads === 1 ? 'previous-loader' : 'current-loader';
          return { frameTree: { frame: { id: 'main', loaderId } } } as T;
        }
        return {} as T;
      },
      waitFor(_method, _sessionId, _timeout, filter) {
        predicate = filter;
        predicate?.({
          method: 'Page.lifecycleEvent',
          sessionId: 'session',
          params: { frameId: 'main', loaderId: 'current-loader', name: 'load' },
        });
        return waiter;
      },
    });

    await reloadChromeTarget(cdp, 'session', 'main', 100);
    expect(
      predicate?.({
        method: 'Page.lifecycleEvent',
        sessionId: 'session',
        params: { frameId: 'main', loaderId: 'previous-loader', name: 'load' },
      }),
    ).to.eql(false);
    expect(
      predicate?.({
        method: 'Page.lifecycleEvent',
        sessionId: 'session',
        params: { frameId: 'main', loaderId: 'current-loader', name: 'load' },
      }),
    ).to.eql(true);
  });

  it('reload command failure → cancels its abandoned event waiter', async () => {
    let cancelCalls = 0;
    const waiting = new Promise<t.Browser.Chrome.Cdp.Message>(() =>
      undefined
    ) as t.Browser.Chrome.Cdp.Waiter;
    Object.defineProperty(waiting, 'cancel', { value: () => cancelCalls += 1 });
    const cdp = protocolStub({
      async send<T = Record<string, unknown>>(method: string) {
        if (method === 'Page.getFrameTree') {
          return { frameTree: { frame: { id: 'main', loaderId: 'previous-loader' } } } as T;
        }
        throw new Error('reload-command-failed');
      },
      waitFor() {
        return waiting;
      },
    });

    let caught: unknown;
    try {
      await reloadChromeTarget(cdp, 'session', 'main', 100);
    } catch (cause) {
      caught = cause;
    }

    expect(caught).to.be.instanceOf(Error);
    expect((caught as Error).message).to.contain('reload-command-failed');
    expect(cancelCalls).to.eql(1);
  });

  it('origin guard → retains a violation queued after an earlier settle', async () => {
    let emit: ((message: t.Browser.Chrome.Cdp.Message) => void) | undefined;
    const cdp = protocolStub({
      on(handler) {
        emit = handler;
        return () => undefined;
      },
      async send<T = Record<string, unknown>>(method: string) {
        if (method === 'Fetch.continueRequest') await Time.wait(20);
        return {} as T;
      },
    });
    const guard = await guardChromeTargetOrigin(
      cdp,
      'session',
      'main',
      'http://127.0.0.1:1234',
    );

    emit?.({
      method: 'Fetch.requestPaused',
      sessionId: 'session',
      params: {
        requestId: 'allowed',
        request: { url: 'http://127.0.0.1:1234/' },
        resourceType: 'Document',
        frameId: 'main',
      },
    });
    setTimeout(() => {
      emit?.({
        method: 'Fetch.requestPaused',
        sessionId: 'session',
        params: {
          requestId: 'blocked',
          request: { url: 'https://example.com/' },
          resourceType: 'Document',
          frameId: 'main',
        },
      });
    }, 5);

    let caught: unknown;
    try {
      await guard.settle();
    } catch (cause) {
      caught = cause;
    }
    expect(caught).to.be.instanceOf(Error);
    expect((caught as Error).message).to.contain('fixed-origin escape');
  });

  it('origin guard setup failure → unregisters its event listener', async () => {
    let offCalls = 0;
    const setup = new Error('fetch-enable-failed');
    const cdp = protocolStub({
      on() {
        return () => offCalls += 1;
      },
      async send<T = Record<string, unknown>>(method: string) {
        if (method === 'Fetch.enable') throw setup;
        return {} as T;
      },
    });

    let caught: unknown;
    try {
      await guardChromeTargetOrigin(cdp, 'session', 'main', 'http://127.0.0.1:1234');
    } catch (cause) {
      caught = cause;
    }
    expect(caught).to.equal(setup);
    expect(offCalls).to.eql(1);
  });

  it('origin guard close → disables Fetch after draining queued work', async () => {
    const order: string[] = [];
    let emit: ((message: t.Browser.Chrome.Cdp.Message) => void) | undefined;
    const cdp = protocolStub({
      on(handler) {
        emit = handler;
        return () => undefined;
      },
      async send<T = Record<string, unknown>>(method: string) {
        if (method === 'Fetch.continueRequest') {
          await Time.wait(10);
          order.push('continue');
        }
        if (method === 'Fetch.disable') order.push('disable');
        return {} as T;
      },
    });
    const guard = await guardChromeTargetOrigin(
      cdp,
      'session',
      'main',
      'http://127.0.0.1:1234',
    );
    emit?.({
      method: 'Fetch.requestPaused',
      sessionId: 'session',
      params: {
        requestId: 'allowed',
        request: { url: 'http://127.0.0.1:1234/' },
        resourceType: 'Document',
        frameId: 'main',
      },
    });

    await guard.close(100);
    await guard.close(100);
    expect(order).to.eql(['continue', 'disable']);
  });

  it('origin guard close → retains a violation queued during disable', async () => {
    let emit: ((message: t.Browser.Chrome.Cdp.Message) => void) | undefined;
    const cdp = protocolStub({
      on(handler) {
        emit = handler;
        return () => undefined;
      },
      async send<T = Record<string, unknown>>(method: string) {
        if (method === 'Fetch.disable') {
          emit?.({
            method: 'Fetch.requestPaused',
            sessionId: 'session',
            params: {
              requestId: 'blocked-during-disable',
              request: { url: 'https://example.com/' },
              resourceType: 'Document',
              frameId: 'main',
            },
          });
        }
        return {} as T;
      },
    });
    const guard = await guardChromeTargetOrigin(
      cdp,
      'session',
      'main',
      'http://127.0.0.1:1234',
    );

    let caught: unknown;
    try {
      await guard.close(100);
    } catch (cause) {
      caught = cause;
    }
    expect(caught).to.be.instanceOf(Error);
    expect((caught as Error).message).to.contain('fixed-origin escape');
  });

  it('origin guard close → retains violation and Fetch-disable failure identities', async () => {
    const cleanup = new Error('fetch-disable-failed');
    let emit: ((message: t.Browser.Chrome.Cdp.Message) => void) | undefined;
    const cdp = protocolStub({
      on(handler) {
        emit = handler;
        return () => undefined;
      },
      async send<T = Record<string, unknown>>(method: string) {
        if (method === 'Fetch.disable') throw cleanup;
        return {} as T;
      },
    });
    const guard = await guardChromeTargetOrigin(
      cdp,
      'session',
      'main',
      'http://127.0.0.1:1234',
    );
    emit?.({
      method: 'Fetch.requestPaused',
      sessionId: 'session',
      params: {
        requestId: 'blocked',
        request: { url: 'https://example.com/' },
        resourceType: 'Document',
        frameId: 'main',
      },
    });

    let caught: unknown;
    try {
      await guard.close(100);
    } catch (cause) {
      caught = cause;
    }
    expect(caught).to.be.instanceOf(SuppressedError);
    expect((caught as SuppressedError).error).to.be.instanceOf(Error);
    expect(((caught as SuppressedError).error as Error).message).to.contain(
      'fixed-origin escape',
    );
    expect((caught as SuppressedError).suppressed).to.equal(cleanup);
  });

  it('primary and cleanup failures → retain operation as primary identity', () => {
    const primary = new Error('operation-failed');
    const combined = combinePrimaryAndCleanup(primary, [
      { stage: 'process-close', error: 'process-live', unresolved: true },
      { stage: 'profile-remove', error: 'profile-live', unresolved: true },
    ]);

    expect(combined).to.be.instanceOf(SuppressedError);
    expect(combined.error).to.equal(primary);
    expect(combined.suppressed).to.be.instanceOf(Error);
    expect((combined.suppressed as Error).message).to.contain('process-live');
    expect((combined.suppressed as Error).message).to.contain('profile-live');
  });

  it('error-like primary → preserves typed enumerable evidence through cleanup failure', () => {
    const combined = combinePrimaryAndCleanup(
      { name: 'TypedOperationError', message: 'operation-failed', code: 'E_OPERATION' },
      [{ stage: 'process-close', error: 'process-live', unresolved: true }],
    );
    const primary = combined.error as Error & { code?: string };

    expect(primary).to.be.instanceOf(Error);
    expect(primary.name).to.eql('TypedOperationError');
    expect(primary.message).to.eql('operation-failed');
    expect(primary.code).to.eql('E_OPERATION');
  });

  it('listener setup failure → closes the spawned process before removing its profile', async () => {
    const order: string[] = [];
    const result = await startChrome('/fake/chrome', launchModes()[0], {
      makeProfile: async () => '/custom/tmp/sys-testing-chrome-listener-fault',
      spawn: () =>
        processStub({
          dispose: async () => {
            order.push('process-close');
          },
          onStdErr: () => {
            throw new Error('listener-setup-failed');
          },
        }),
      removeProfile: async () => {
        order.push('profile-remove');
      },
    });

    expect(result.ok).to.eql(false);
    if (result.ok) throw new Error('expected failed start');
    expect(result.error).to.contain('listener-setup-failed');
    expect(result.cleanup).to.eql([]);
    expect(order).to.eql(['process-close', 'profile-remove']);
  });

  it('synchronous process-close failure → retains profile and reports unresolved ownership', async () => {
    const profile = '/custom/tmp/sys-testing-chrome-sync-fault';
    let removeCalls = 0;
    const result = await startChrome('/fake/chrome', launchModes()[0], {
      makeProfile: async () => profile,
      spawn: () =>
        processStub({
          dispose: () => {
            throw new Error('process-close-threw');
          },
        }),
      removeProfile: async () => {
        removeCalls += 1;
      },
      startTimeout: 1,
      closeTimeout: 10,
    });

    expect(result.ok).to.eql(false);
    if (result.ok) throw new Error('expected failed start');
    expect(result.cleanup).to.eql([
      { stage: 'process-close', error: 'process-close-threw', unresolved: true },
    ]);
    expect(removeCalls).to.eql(0);
    expect(result.error.includes(profile)).to.eql(false);
  });

  it('process-close failure → retains profile and reports unresolved ownership', async () => {
    const profile = '/custom/tmp/sys-testing-chrome-fault';
    let removeCalls = 0;
    const proc = processStub({
      dispose: async () => {
        throw new Error('process-still-running');
      },
    });
    const result = await startChrome('/fake/chrome', launchModes()[0], {
      makeProfile: async () => profile,
      spawn: () => proc,
      removeProfile: async () => {
        removeCalls += 1;
      },
      startTimeout: 1,
      closeTimeout: 10,
    });

    expect(result.ok).to.eql(false);
    if (result.ok) throw new Error('expected failed start');
    expect(result.cleanup).to.eql([
      { stage: 'process-close', error: 'process-still-running', unresolved: true },
    ]);
    expect(removeCalls).to.eql(0);
    expect(result.error.includes(profile)).to.eql(false);
  });

  it('profile removal → occurs only after process-close settlement', async () => {
    const order: string[] = [];
    const started = await startChrome('/fake/chrome', launchModes()[0], {
      makeProfile: async () => '/custom/tmp/sys-testing-chrome-order',
      spawn: () =>
        processStub({
          dispose: async () => {
            order.push('process-close');
          },
        }),
      removeProfile: async () => {
        order.push('profile-remove');
      },
      devtoolsUrl: 'ws://127.0.0.1/devtools/browser/test',
    });

    expect(started.ok).to.eql(true);
    if (!started.ok) throw new Error('expected successful start');
    await started.close();
    expect(order).to.eql(['process-close', 'profile-remove']);
    await started.close();
    expect(order).to.eql(['process-close', 'profile-remove']);
  });

  it('profile-remove timeout → reports unresolved ownership without leaking path', async () => {
    const profile = '/custom/tmp/sys-testing-chrome-remove-timeout';
    const result = await startChrome('/fake/chrome', launchModes()[0], {
      makeProfile: async () => profile,
      spawn: () => processStub(),
      removeProfile: () => new Promise(() => undefined),
      startTimeout: 1,
      profileRemoveTimeout: 5,
    });

    expect(result.ok).to.eql(false);
    if (result.ok) throw new Error('expected failed start');
    expect(result.cleanup.length).to.eql(1);
    expect(result.cleanup[0]).to.include({ stage: 'profile-remove', unresolved: true });
    expect(result.cleanup[0].error).to.contain('Timed out after 5ms');
    expect(result.cleanup[0].error.includes(profile)).to.eql(false);
  });

  it('session cleanup → reports all failures and calls process/profile owner once', async () => {
    const sent: string[] = [];
    let closed = 0;
    let processClose = 0;
    const cdp = cdpStub({
      async send(method) {
        sent.push(method);
        throw new Error('browser-ack-failed');
      },
      close() {
        closed += 1;
      },
    });
    const start: t.Browser.Chrome.Start.Started = {
      ok: true,
      browserWs: 'ws://127.0.0.1/devtools/browser/test',
      stderr: () => '',
      async close() {
        processClose += 1;
        return Object.freeze([
          { stage: 'process-close' as const, error: 'process-live', unresolved: true },
          { stage: 'profile-remove' as const, error: 'profile-live', unresolved: true },
        ]);
      },
    };

    let caught: unknown;
    try {
      await closeChromeSession(cdp, start);
    } catch (cause) {
      caught = cause;
    }
    expect(caught).to.be.instanceOf(Error);
    expect((caught as Error).message).to.contain('browser-ack-failed');
    expect((caught as Error).message).to.contain('process-live');
    expect((caught as Error).message).to.contain('profile-live');
    expect(sent).to.eql(['Browser.close']);
    expect(closed).to.eql(1);
    expect(processClose).to.eql(1);
  });
});

function processStub(
  overrides: Partial<Pick<TProcess.Handle, 'dispose' | 'onStdErr' | 'onStdOut'>> = {},
): Pick<TProcess.Handle, 'dispose' | 'onStdErr' | 'onStdOut'> {
  let api!: Pick<TProcess.Handle, 'dispose' | 'onStdErr' | 'onStdOut'>;
  api = {
    dispose: async () => undefined,
    onStdOut: () => api as TProcess.Handle,
    onStdErr: () => api as TProcess.Handle,
    ...overrides,
  };
  return api;
}

function protocolStub(
  overrides: Partial<t.Browser.Chrome.Cdp.ProtocolClient> = {},
): t.Browser.Chrome.Cdp.ProtocolClient {
  return {
    async send<T = Record<string, unknown>>() {
      return {} as T;
    },
    on() {
      return () => undefined;
    },
    waitFor() {
      const waiter = Promise.resolve({}) as t.Browser.Chrome.Cdp.Waiter;
      Object.defineProperty(waiter, 'cancel', { value: () => undefined });
      return waiter;
    },
    ...overrides,
  };
}

function cdpStub(
  overrides: Partial<t.Browser.Chrome.Cdp.Client> = {},
): t.Browser.Chrome.Cdp.Client {
  return {
    async send<T = Record<string, unknown>>() {
      return {} as T;
    },
    on() {
      return () => undefined;
    },
    waitFor() {
      const waiter = Promise.resolve({}) as t.Browser.Chrome.Cdp.Waiter;
      Object.defineProperty(waiter, 'cancel', { value: () => undefined });
      return waiter;
    },
    close() {
      // No-op stub.
    },
    ...overrides,
  };
}
