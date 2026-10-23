import { Cmd, D, Err, Json, Rx, type t } from '../common.ts';
import { readResponse } from '../u/u.response.ts';
import { cmdError, createId, requestHeaders, startTimeout } from '../u/u.ts';

/** Create a typed unary Cmd client over HTTP JSON. */
export function client<
  N extends string = t.Cmd.Name,
  P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
>(options: t.HttpCmd.ClientOptions): t.HttpCmd.Client<N, P, R> {
  type Client = t.HttpCmd.Client<N, P, R>;

  const life = Rx.lifecycle();
  const active = new Set<AbortController>();
  const fetcher = options.fetch ?? globalThis.fetch;
  const { ns } = options;

  life.dispose$.subscribe(() => {
    for (const controller of active) controller.abort(D.DisposeReason.clientDispose);
    active.clear();
  });

  const send = async <K extends N>(name: K, payload: P[K]): Promise<R[K]> => {
    const id = createId();
    const meta = { id, name, ns };
    const fail = (kind: t.Cmd.Error.Kind, msg: string): never => {
      throw cmdError(kind, msg, meta);
    };

    if (life.disposed) fail('CmdError.ClientDisposed', 'Command client is disposed.');

    const controller = new AbortController();
    active.add(controller);

    let timedOut = false;
    const timeoutTimer = startTimeout(options.timeout, () => {
      timedOut = true;
      controller.abort('timeout');
    });

    try {
      const request: t.Cmd.Wire.Request = { kind: 'cmd', id, ns, name, payload };
      const response = await fetcher(options.url, {
        method: D.method,
        headers: requestHeaders(options.headers),
        body: Json.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const msg = `HTTP Cmd request failed: ${response.status} ${response.statusText}`;
        fail('CmdError.Remote', msg);
      }

      const msg = await readResponse(response, meta);
      if (msg.error !== undefined) fail('CmdError.Remote', msg.error);

      return msg.payload as R[K];
    } catch (cause) {
      if (Cmd.Is.error(cause)) throw cause;
      if (timedOut) {
        const timeout = timeoutTimer?.timeout ?? options.timeout;
        fail('CmdError.Timeout', `Command "${name}" timed out after ${timeout}ms.`);
      }
      if (life.disposed) {
        fail('CmdError.ClientDisposed', 'Command client disposed before response.');
      }
      return fail('CmdError.Remote', Err.std(cause).message);
    } finally {
      timeoutTimer?.cancel();
      active.delete(controller);
    }
  };

  return Rx.toLifecycle<Client>(life, { send });
}
