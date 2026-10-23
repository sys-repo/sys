import { Err, Is, Str, type t } from './common.ts';

const PAGE_LOAD_TIMEOUT = 15_000;
const TOP_FRAME_NAVIGATION_PATTERN = '*';

type LifecycleEventParams = {
  readonly frameId?: unknown;
  readonly loaderId?: unknown;
  readonly name?: unknown;
};
type RequestPausedParams = {
  readonly requestId?: unknown;
  readonly request?: { readonly url?: unknown };
  readonly resourceType?: unknown;
  readonly frameId?: unknown;
};

/** Attach one blank target session and enable the fixed browser protocol used by Testing. */
export async function attachChromeTarget(cdp: t.Browser.Chrome.Cdp.ProtocolClient) {
  const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', {
    url: 'about:blank',
  });
  const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', {
    targetId,
    flatten: true,
  });

  const frameTree = await cdp.send<{ frameTree?: { frame?: { id?: unknown } } }>(
    'Page.getFrameTree',
    {},
    sessionId,
  );
  const mainFrameId = frameTree.frameTree?.frame?.id;
  if (!Is.str(targetId) || !targetId || !Is.str(sessionId) || !sessionId) {
    throw new Error('Chrome target attachment returned an invalid identity.');
  }
  if (!Is.str(mainFrameId) || !mainFrameId) {
    throw new Error('Chrome target did not expose a main frame.');
  }
  return Object.freeze({ targetId, sessionId, mainFrameId });
}

/** Enable fixed target domains after callers have attached their diagnostic listener. */
export async function enableChromeTarget(
  cdp: t.Browser.Chrome.Cdp.ProtocolClient,
  sessionId: string,
) {
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Log.enable', {}, sessionId);
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Page.setLifecycleEventsEnabled', { enabled: true }, sessionId);
}

/**
 * Prevent top-level document requests from leaving one fixed origin before network dispatch.
 * Subresource and child-frame policy remains the page/server owner's responsibility.
 */
export async function guardChromeTargetOrigin(
  cdp: t.Browser.Chrome.Cdp.ProtocolClient,
  sessionId: string,
  mainFrameId: string,
  fixedOrigin: string,
) {
  let violation: Error | undefined;
  let chain = Promise.resolve();
  const off = cdp.on((message) => {
    if (message.sessionId !== sessionId || message.method !== 'Fetch.requestPaused') return;
    chain = chain.then(async () => {
      const params = Is.record(message.params) ? message.params as RequestPausedParams : {};
      const requestId = params.requestId;
      const url = params.request?.url;
      const topDocument = params.resourceType === 'Document' && params.frameId === mainFrameId;
      if (!Is.str(requestId)) return;
      if (!topDocument) {
        await cdp.send('Fetch.continueRequest', { requestId }, sessionId);
        return;
      }

      let allowed = false;
      if (Is.str(url)) {
        try {
          allowed = new URL(url).origin === fixedOrigin;
        } catch {
          allowed = false;
        }
      }
      if (allowed) {
        await cdp.send('Fetch.continueRequest', { requestId }, sessionId);
        return;
      }

      violation = new Error(
        'Browser Service Worker navigation was blocked before fixed-origin escape.',
      );
      await cdp.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }, sessionId);
    }).catch((cause) => {
      violation ??= Err.normalize(cause);
    });
  });

  try {
    await cdp.send(
      'Fetch.enable',
      { patterns: [{ urlPattern: TOP_FRAME_NAVIGATION_PATTERN, resourceType: 'Document' }] },
      sessionId,
    );
  } catch (cause) {
    off();
    throw cause;
  }

  const drain = async (deadline: number) => {
    while (true) {
      const observed = chain;
      const bounded = deadlinePromise(deadline, 'origin-guard settlement');
      try {
        await Promise.race([observed, bounded.promise]);
      } finally {
        bounded.cancel();
      }
      await nextTurn(deadline, 'origin-guard settlement');
      if (observed === chain) break;
    }
  };
  const settle = async (deadline: number) => {
    await drain(deadline);
    if (violation) throw violation;
  };
  let closePromise: Promise<void> | undefined;

  return Object.freeze({
    async settle(timeout: t.Msecs = PAGE_LOAD_TIMEOUT) {
      await settle(deadlineAfter(timeout));
    },
    close(timeout: t.Msecs = PAGE_LOAD_TIMEOUT) {
      return closePromise ??= (async () => {
        const deadline = deadlineAfter(timeout);
        let primary: unknown;
        try {
          await settle(deadline);
        } catch (cause) {
          primary = cause;
        }

        const cleanup: unknown[] = [];
        let disabled = false;
        try {
          await cdp.send(
            'Fetch.disable',
            {},
            sessionId,
            remaining(deadline, 'origin-guard close'),
          );
          disabled = true;
        } catch (cause) {
          cleanup.push(cause);
        }
        try {
          await drain(deadline);
        } catch (cause) {
          cleanup.push(cause);
        }
        if (primary === undefined && violation !== undefined) primary = violation;
        if (disabled) off();

        const cleanupError = cleanup.length === 0
          ? undefined
          : cleanup.length === 1
          ? cleanup[0]
          : new AggregateError(cleanup, 'Origin guard cleanup failed.');
        if (primary !== undefined && cleanupError !== undefined) {
          throw new SuppressedError(
            primary,
            cleanupError,
            'Origin guard failed and Fetch cleanup also failed.',
          );
        }
        if (cleanupError !== undefined) throw cleanupError;
        if (primary !== undefined) throw primary;
      })();
    },
  });
}

/** Navigate the attached target and wait for its correlated main-frame load lifecycle. */
export async function navigateChromeTarget(
  cdp: t.Browser.Chrome.Cdp.ProtocolClient,
  sessionId: string,
  mainFrameId: string,
  url: string,
  timeout: t.Msecs = PAGE_LOAD_TIMEOUT,
) {
  const deadline = deadlineAfter(timeout);
  let expectedLoaderId: string | undefined;
  const loadedBeforeResponse = new Set<string>();
  let releaseLoader!: () => void;
  const loaderReady = new Promise<void>((resolve) => (releaseLoader = resolve));
  const off = cdp.on((message) => {
    if (message.method !== 'Page.lifecycleEvent' || message.sessionId !== sessionId) return;
    const params = Is.record(message.params) ? message.params as LifecycleEventParams : {};
    if (
      params.frameId !== mainFrameId || params.name !== 'load' || !Is.str(params.loaderId) ||
      !params.loaderId
    ) return;
    if (!expectedLoaderId) loadedBeforeResponse.add(params.loaderId);
    if (params.loaderId === expectedLoaderId) releaseLoader();
  });
  const loadDeadline = deadlinePromise(deadline, 'navigation load lifecycle');
  try {
    const response = await cdp.send<{ errorText?: unknown; loaderId?: unknown }>(
      'Page.navigate',
      { url },
      sessionId,
      remaining(deadline, 'navigation command'),
    );
    if (Is.str(response.errorText) && response.errorText) {
      throw new Error(`Chrome navigation failed: ${response.errorText}`);
    }
    if (!Is.str(response.loaderId) || !response.loaderId) {
      throw new Error('Chrome navigation did not return a loader identity.');
    }
    expectedLoaderId = response.loaderId;
    if (loadedBeforeResponse.has(expectedLoaderId)) releaseLoader();
    await Promise.race([loaderReady, loadDeadline.promise]);
  } finally {
    off();
    loadDeadline.cancel();
  }
}

/** Reload the attached target and wait for a new correlated main-frame load lifecycle. */
export async function reloadChromeTarget(
  cdp: t.Browser.Chrome.Cdp.ProtocolClient,
  sessionId: string,
  mainFrameId: string,
  timeout: t.Msecs = PAGE_LOAD_TIMEOUT,
) {
  const deadline = deadlineAfter(timeout);
  const frameTree = await cdp.send<{
    frameTree?: { frame?: { id?: unknown; loaderId?: unknown } };
  }>('Page.getFrameTree', {}, sessionId, remaining(deadline, 'reload frame identity'));
  const frame = frameTree.frameTree?.frame;
  if (frame?.id !== mainFrameId || !Is.str(frame.loaderId) || !frame.loaderId) {
    throw new Error('Chrome reload could not establish the current main-frame loader identity.');
  }
  const previousLoaderId = frame.loaderId;
  const loaded = cdp.waitFor(
    'Page.lifecycleEvent',
    sessionId,
    remaining(deadline, 'reload load lifecycle'),
    (message) => {
      const params = Is.record(message.params) ? message.params as LifecycleEventParams : {};
      return params.frameId === mainFrameId && params.name === 'load' &&
        Is.str(params.loaderId) && Boolean(params.loaderId) && params.loaderId !== previousLoaderId;
    },
  );
  try {
    await cdp.send(
      'Page.reload',
      { ignoreCache: true, loaderId: previousLoaderId },
      sessionId,
      remaining(deadline, 'reload command'),
    );
    const loadedMessage = await loaded;
    const loadedParams = Is.record(loadedMessage.params)
      ? loadedMessage.params as LifecycleEventParams
      : {};
    const reloadedLoaderId = loadedParams.loaderId;
    if (!Is.str(reloadedLoaderId) || !reloadedLoaderId) {
      throw new Error('Chrome reload did not expose a new loader identity.');
    }
    const current = await cdp.send<{
      frameTree?: { frame?: { id?: unknown; loaderId?: unknown } };
    }>('Page.getFrameTree', {}, sessionId, remaining(deadline, 'reload correlation'));
    if (
      current.frameTree?.frame?.id !== mainFrameId ||
      current.frameTree.frame.loaderId !== reloadedLoaderId
    ) {
      throw new Error('Chrome reload load lifecycle did not match the current main-frame loader.');
    }
  } catch (cause) {
    loaded.cancel();
    throw cause;
  }
}

/** Run one fixed, internal expression and return its by-value result. */
export async function evaluateChromeTarget<T>(
  cdp: t.Browser.Chrome.Cdp.ProtocolClient,
  sessionId: string,
  expression: string,
  timeout?: t.Msecs,
): Promise<T> {
  const response = await cdp.send<t.Browser.Chrome.Cdp.Evaluate.Response>(
    'Runtime.evaluate',
    { expression, awaitPromise: true, returnByValue: true, userGesture: false },
    sessionId,
    timeout,
  );
  if (response.exceptionDetails) {
    const detail = response.exceptionDetails;
    const description = detail.exception?.description ?? detail.text ?? 'Runtime.evaluate failed';
    throw new Error(Str.truncate(String(description), 500));
  }
  return response.result.value as T;
}

function deadlineAfter(timeout: number) {
  return Date.now() + timeout;
}

function deadlinePromise(deadline: number, label: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Timed out waiting for Chrome ${label}.`)),
      remaining(deadline, label),
    );
  });
  return { promise, cancel: () => timer && clearTimeout(timer) } as const;
}

async function nextTurn(deadline: number, label: string) {
  remaining(deadline, label);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  remaining(deadline, label);
}

function remaining(deadline: number, label: string) {
  const value = deadline - Date.now();
  if (value < 1) throw new Error(`Timed out waiting for Chrome ${label}.`);
  return value;
}
