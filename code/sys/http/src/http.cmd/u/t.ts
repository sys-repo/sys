import type { t } from '../common.ts';

/** Private handler authority captured before request processing. */
export type HandlerSnapshot<
  N extends string,
  P extends t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N>,
> = {
  readonly path: t.StringUrlRoute | undefined;
  readonly ns: t.Cmd.Namespace | undefined;
  readonly handlers: ReadonlyMap<string, t.Cmd.Handler.Fn<N, P, R, E>>;
  readonly policy: t.HttpCmd.Policy;
};
