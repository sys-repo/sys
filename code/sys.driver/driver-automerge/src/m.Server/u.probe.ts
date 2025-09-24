import { type t, Err, Pkg, WS } from './common.ts';

/**
 * Probe a sync server by performing a WebSocket handshake and returning response headers.
 */
export const probe: t.ProbeSyncServer = async (url, options = {}) => {
  const timeout = options.timeout ?? (5_000 as t.Msecs);
  const t0 = performance.now();
  const errors: t.StdError[] = [];

  const fail = (): t.ProbeResult => {
    return {
      url,
      pkg: Pkg.unknown(),
      headers: emptyHeaders(),
      errors,
      elapsed: elapsedSince(t0),
    };
  };

  // Validate URL first (the WS constructor throws synchronously on bad input).
  const urlOk = validateWsUrl(url);
  if (!urlOk.ok) {
    errors.push(Err.std(`url/invalid: ${url}`, { cause: urlOk.error }));
    return fail();
  }

  // Construct client; guard against sync constructor errors.
  let client: InstanceType<typeof WS> | undefined;
  try {
    client = new WS(url);
  } catch (cause) {
    errors.push(Err.std('websocket/construct', { cause }));
    return fail();
  }

  let headersRaw: Record<string, string> = {};

  // Await: either "open", "error", or timeout.
  await new Promise<void>((resolve) => {
    const onUpgrade = (res: any) => {
      headersRaw = (res?.headers ?? {}) as Record<string, string>;
    };
    const onOpen = () => done();
    const onError = (cause: unknown) => {
      errors.push(Err.std('websocket/open', { cause }));
      done();
    };

    client!.once('upgrade', onUpgrade);
    client!.once('open', onOpen);
    client!.once('error', onError);

    const to = setTimeout(() => {
      errors.push(Err.std('timeout', { cause: `probeSyncServer timeout after ${timeout}ms` }));
      done();
    }, timeout);

    function cleanup() {
      clearTimeout(to);
      client!.off('upgrade', onUpgrade);
      client!.off('open', onOpen);
      client!.off('error', onError);
    }

    function done() {
      cleanup();
      resolve();
    }
  });

  // Close socket regardless of outcome (safe if not fully opened).
  try {
    client.close();
  } catch {
    /* noop */
  }

  const headers = headersRaw as t.SyncServerHandsakeHeaders;
  const result: t.ProbeResult = {
    url,
    pkg: Pkg.toPkg(headers['sys-pkg']),
    headers,
    errors,
    elapsed: elapsedSince(t0),
  };

  return result;
};

/**
 * Helpers:
 */
function validateWsUrl(u: string): { ok: true } | { ok: false; error: unknown } {
  try {
    const parsed = new URL(u);
    const proto = parsed.protocol.toLowerCase();
    if (proto !== 'ws:' && proto !== 'wss:') {
      return { ok: false, error: new Error(`invalid protocol: ${proto}`) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

function emptyHeaders(): t.SyncServerHandsakeHeaders {
  // Return a typed-empty shape; callers/tests assert fields they care about.
  return {} as unknown as t.SyncServerHandsakeHeaders;
}

function elapsedSince(t0: number): t.Msecs {
  return Math.max(0, Math.round(performance.now() - t0));
}
