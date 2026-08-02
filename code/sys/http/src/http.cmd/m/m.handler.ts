import type { t } from '../common.ts';
import { handle } from './m.handle.ts';

/** Create a Fetch-compatible request handler bound to Cmd handlers. */
export function handler<
  N extends string = t.Cmd.Name,
  P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
>(options: t.HttpCmd.HandlerOptions<N, P, R, E>): t.HttpCmd.RequestHandler {
  return (request) => handle(request, options);
}
