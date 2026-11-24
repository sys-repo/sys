import type { HttpOperation } from '../../u/t.ts';
import { readBytes } from '../../u/u.body.ts';
import { createHttpOperation } from '../../u/u.operation.ts';
import { Bytes, Cmd, D, Json, Num, Rx, type t } from '../common.ts';
import { clientOptions, requestHeaders, sendOptions } from '../u/u.input.ts';
import { readResponse } from '../u/u.response.ts';
import { createId, failure } from '../u/u.ts';

/**
 * Create a fixed-endpoint unary client with private request authority and bounded settlement.
 */
export function client<
  N extends string = t.Cmd.Name,
  P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
>(input: t.HttpCmd.ClientOptions): t.HttpCmd.Client<N, P, R> {
  const options = clientOptions(input);
  const { fetch: fetcher } = options;
  const life = Rx.lifecycle();
  const active = new Set<() => void>();
  life.dispose$.subscribe(() => {
    for (const stop of active) stop();
  });

  const send = async <K extends N>(
    name: K,
    payload: P[K],
    input?: t.HttpCmd.SendOptions,
  ): Promise<R[K]> => {
    if (life.disposed) throw failure('disposed');
    const operation = createHttpOperation<t.HttpCmd.FailureKind>(
      new AbortController().signal,
      options.policy.timeout,
      { cancelled: 'cancelled', timeout: 'timeout' },
    );
    const dispose = () => operation.stop('disposed');
    active.add(dispose);
    let phase: t.HttpCmd.FailureKind = 'invalid-request';
    let dispatch: t.HttpCmd.Error['dispatch'] = 'not-dispatched';
    let status: number | undefined;
    let response: Response | undefined;
    let signal: AbortSignal | undefined;
    const abort = () => operation.stop('cancelled');

    try {
      const call = sendOptions(input);
      signal = call.signal;
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) abort();
      operation.throwIfStopped();
      const id = createId();
      const request: t.Cmd.Wire.Request = { kind: 'cmd', id, ns: options.ns, name, payload };
      if (!Cmd.Is.request(request)) throw undefined;
      const headers = requestHeaders(options.headers, call.headers);
      const body = Json.stringify(request, 0);
      if (Bytes.utf8ByteLength(body) > options.policy.maxBytes.request) {
        operation.stop('request-too-large');
      }
      operation.throwIfStopped();

      phase = 'network';
      dispatch = 'possible';
      response = await operation.raceFetch(Promise.resolve(fetcher(options.url, {
        method: D.method,
        headers,
        body,
        signal: operation.signal,
        credentials: 'omit',
        redirect: 'manual',
        cache: 'no-store',
        referrer: '',
        referrerPolicy: 'no-referrer',
      })));
      operation.throwIfStopped();
      if (Num.Is.safeInt(response.status) && response.status >= 200 && response.status <= 599) {
        status = response.status;
      }
      if (
        response.redirected || response.type === 'opaqueredirect' ||
        (response.status >= 300 && response.status <= 399)
      ) {
        operation.stop('redirect');
        operation.throwIfStopped();
      }
      if (response.type === 'opaque' || response.type === 'error') throw undefined;

      const bytes = await readBytes({
        body: response.body,
        maxBytes: options.policy.maxBytes.response,
        operation,
        overflow() {
          operation.stop('response-too-large');
          operation.throwIfStopped();
          throw undefined;
        },
      });
      phase = 'protocol';
      const msg = readResponse(bytes, request);
      operation.throwIfStopped();
      if (msg.error !== undefined) {
        operation.stop('remote');
        operation.throwIfStopped();
      }
      return msg.payload as R[K];
    } catch {
      // Observe elapsed synchronous work too; external error identity has no authority.
      operation.checkDeadline();
      throw failure(operation.terminal ?? phase, dispatch, status);
    } finally {
      detachAbort(signal, abort);
      discardResponse(response, operation);
      operation.dispose();
      active.delete(dispose);
    }
  };
  return Rx.toLifecycle<t.HttpCmd.Client<N, P, R>>(life, { send });
}

/**
 * Helpers:
 */
function detachAbort(signal: AbortSignal | undefined, abort: () => void): void {
  try {
    signal?.removeEventListener('abort', abort);
  } catch {
    // The settled result retains authority over caller-owned cleanup errors.
  }
}

/** Retire a fetched body without waiting; injected response access may itself throw. */
function discardResponse(
  response: Response | undefined,
  operation: HttpOperation<t.HttpCmd.FailureKind>,
): void {
  try {
    if (response) void operation.cancelBody(response.body);
  } catch {
    // Never expose injected response getters through a cleanup diagnostic.
  }
}
