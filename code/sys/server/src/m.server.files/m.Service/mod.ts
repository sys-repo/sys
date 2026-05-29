/**
 * @module
 * Cell-compatible lifecycle endpoint for Files-over-WebSocket services.
 */
import type { t } from './common.ts';
import { start } from './m.start.ts';
import { resources } from './u.resources.ts';

export type * from './t.ts';

/**
 * Cell-compatible lifecycle endpoint for Files-over-WebSocket services.
 */
export const FilesWebSocketService: t.FilesWebSocketService.Lib = { resources, start };
