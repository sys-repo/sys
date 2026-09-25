/**
 * @module
 * Files server facades over bounded Files model backings.
 */
import type { t } from './common.ts';
import { Http } from './m.Http/mod.ts';
import { WebSocket } from './m.WebSocket/mod.ts';

export type * from './t.ts';

/** Files server facades over bounded Files model backings. */
export const FilesServer: t.FilesServer.Lib = Object.freeze({
  Http,
  WebSocket,
});
