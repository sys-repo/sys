import type { t } from '../common.ts';

/**
 * Libraries:
 */
export { Files } from '@sys/model/files';
export * from '../common.ts';
export { WebSocketServer } from '../m.server.websocket/mod.ts';

type TStatus = Pick<t.WebSocketServer.StatusOptions, 'kind' | 'urlLabel'>;

/**
 * Default values for the Files server facade.
 */
export const DEFAULTS = {
  path: '/files',
  status: { kind: 'files:websocket', urlLabel: 'files:websocket' } satisfies TStatus,
  capabilities: [
    'list',
    'stat',
    'read',
    'write',
    'remove',
    'watch',
    'manifest',
  ] satisfies readonly t.Files.Capability[],
} as const;

/** Short local alias for module defaults. */
export const D = DEFAULTS;
