import type { t } from '../common.ts';

/** Build a Cmd result wire envelope from a request envelope. */
export function cmdResult(
  request: t.Cmd.Wire.Request,
  ns: t.Cmd.Namespace | undefined,
  value: { readonly payload?: unknown; readonly error?: string },
): t.Cmd.Wire.Result {
  return {
    kind: 'cmd:result',
    id: request.id,
    ns,
    name: request.name,
    ...(value.payload === undefined ? {} : { payload: value.payload }),
    ...(value.error === undefined ? {} : { error: value.error }),
  };
}

/** Error message returned when a command has no registered handler. */
export function missingHandlerMessage(name: t.Cmd.Name): string {
  return `No handler registered for command "${name}".`;
}
