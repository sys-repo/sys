import { readBytes } from '../../u/u.body.ts';
import { createHttpOperation } from '../../u/u.operation.ts';
import { Cmd, D, type t } from '../common.ts';
import type { HandlerSnapshot } from '../u/t.ts';
import { decodeJson, matchesPath, response } from '../u/u.http.ts';
import { handlerOptions } from '../u/u.input.ts';
import { cmdResult } from '../u/u.wire.ts';

/**
 * Snapshot request-local handlers and policy before processing one request.
 */
export function handle<
  N extends string = t.Cmd.Name,
  P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
>(request: Request, input: t.HttpCmd.HandlerOptions<N, P, R, E>): Promise<Response> {
  // Keep handle's Promise contract even when configuration is invalid.
  try {
    return handleRequest(request, handlerOptions(input));
  } catch (cause) {
    return Promise.reject(cause);
  }
}

/** Process using an owned snapshot; external work cannot reopen terminal settlement. */
export async function handleRequest<
  N extends string,
  P extends t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N>,
>(request: Request, options: HandlerSnapshot<N, P, R, E>): Promise<Response> {
  const { policy: { maxBytes, timeout }, ns } = options;
  const operation = createHttpOperation<t.HttpCmd.FailureKind>(request.signal, timeout, {
    cancelled: 'cancelled',
    timeout: 'timeout',
  });
  let msg: t.Cmd.Wire.Request | undefined;
  let status = 400;
  try {
    operation.throwIfStopped();
    if (!matchesPath(request, options.path)) {
      return response(undefined, 404, maxBytes.response);
    }
    if (request.method !== D.method) return response(undefined, 405, maxBytes.response);
    const bytes = await readBytes({
      body: request.body,
      operation,
      maxBytes: maxBytes.request,
      overflow() {
        operation.throwIfStopped();
        // Select overflow before reader cancellation can synchronously abort the request.
        operation.stop('request-too-large');
        throw operation.terminal;
      },
    });
    const parsed = decodeJson(bytes);
    operation.throwIfStopped();
    if (!Cmd.Is.request(parsed)) throw undefined;
    if (parsed.ns !== ns) return response(undefined, 404, maxBytes.response);
    msg = parsed;
    const handler = options.handlers.get(msg.name);
    if (!handler) {
      status = 404;
      throw undefined;
    }
    status = 500;
    operation.throwIfStopped();
    const ctx: t.Cmd.Handler.Context<N, E> = {
      id: msg.id,
      name: msg.name as N,
      ns,
      signal: operation.signal,
      emit() {
        // This lane is unary. Events intentionally do not cross HTTP.
      },
    };
    const payload = await operation.race(Promise.resolve(handler(msg.payload as P[N], ctx)));
    operation.throwIfStopped();
    const result = response(cmdResult(msg, ns, { payload }), 200, maxBytes.response);
    operation.throwIfStopped();
    return result;
  } catch {
    // Include synchronous parsing/handler/serialization time in the same deadline.
    operation.checkDeadline();
    if (operation.terminal === 'request-too-large') status = 413;
    if (operation.terminal === 'timeout') status = 504;
    if (operation.terminal === 'cancelled') status = 408;
    const error = msg ? cmdResult(msg, ns, { error: 'HTTP command failed.' }) : undefined;
    return response(error, status, maxBytes.response);
  } finally {
    // Also retire bodies on path/method/namespace rejection. Never await hostile cancellation.
    void operation.cancelBody(request.body);
    operation.dispose();
  }
}
