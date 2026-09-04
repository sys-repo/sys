export { Cmd } from '@sys/event/cmd';
export * from '../common.ts';

/** Defaults for the HTTP Cmd transport. */
export const DEFAULTS = {
  method: 'POST',
  Json: {
    contentType: 'application/json; charset=utf-8',
    accept: 'application/json',
  },
  DisposeReason: {
    clientDispose: 'sys.http.cmd.client.dispose',
  },
} as const;

/** Short local alias for module defaults. */
export const D = DEFAULTS;
