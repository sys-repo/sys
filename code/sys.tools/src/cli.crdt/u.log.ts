import { type t, Log } from './common.ts';

export function createCrdtLog(options: { debug?: boolean } = {}): t.Logger {
  return Log.logger('crdt', {
    method: 'debug',
    timestamp: null,
    enabled: Boolean(options.debug),
  });
}
