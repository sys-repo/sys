import { Cmd, D, Err, type t } from '../common.ts';
import { jsonResponse, matchesPath, readJson, textResponse } from '../u/u.http.ts';
import { cmdResult, missingHandlerMessage } from '../u/u.wire.ts';

/** Handle a single HTTP JSON Cmd request. */
export async function handle<
  N extends string = t.Cmd.Name,
  P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
>(request: Request, options: t.HttpCmd.HandlerOptions<N, P, R, E>): Promise<Response> {
  const cmd = options.cmd;

  if (!matchesPath(request, options.path)) return textResponse('Not Found', 404);
  if (request.method !== D.method) {
    return textResponse('Method Not Allowed', 405, { allow: D.method });
  }

  const parsed = await readJson(request);
  if (!parsed.ok) return textResponse('Request body must be valid JSON.', 400);
  if (!Cmd.Is.request(parsed.data)) return textResponse('Request body must be a Cmd request.', 400);

  const msg = parsed.data;
  if (msg.ns !== cmd.ns) return textResponse('Not Found', 404);

  const handler = cmd.handlers[msg.name as N];
  if (!handler) {
    return jsonResponse(cmdResult(msg, cmd.ns, { error: missingHandlerMessage(msg.name) }));
  }

  const controller = new AbortController();
  const abort = () => controller.abort(request.signal.reason ?? 'request-abort');
  if (request.signal.aborted) abort();
  else request.signal.addEventListener('abort', abort, { once: true });

  try {
    const ctx: t.Cmd.Handler.Context<N, E, N> = {
      id: msg.id,
      name: msg.name as N,
      ns: cmd.ns,
      signal: controller.signal,
      emit() {
        // Unary HTTP/JSON transport intentionally does not stream events.
      },
    };

    const payload = await handler(msg.payload as P[N], ctx);
    return jsonResponse(cmdResult(msg, cmd.ns, { payload }));
  } catch (cause) {
    return jsonResponse(cmdResult(msg, cmd.ns, { error: Err.std(cause).message }));
  } finally {
    request.signal.removeEventListener('abort', abort);
  }
}
