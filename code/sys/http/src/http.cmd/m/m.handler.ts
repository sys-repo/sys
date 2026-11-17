import type { t } from '../common.ts';
import { handlerOptions } from '../u/u.input.ts';
import { handleRequest } from './m.handle.ts';

/**
 * Snapshot reusable trusted configuration once, without retaining a mutable handler map.
 */
export function handler<
  N extends string = t.Cmd.Name,
  P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
>(input: t.HttpCmd.HandlerOptions<N, P, R, E>): t.HttpCmd.RequestHandler {
  const options = handlerOptions(input);
  return (request) => handleRequest(request, options);
}
