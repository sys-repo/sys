import type { t } from '../common.ts';

export * from '../common.ts';
export { Files } from '@sys/model/files';
export { WebSocketServer } from '../websocket/mod.ts';

/** Default values for the Files server facade. */
export const DEFAULTS = {
  path: '/files',
  status: { kind: 'files:websocket', urlLabel: 'files:websocket' } as const satisfies Pick<
    t.WebSocketServer.StatusOptions,
    'kind' | 'urlLabel'
  >,
  capabilities: [
    'list',
    'stat',
    'read',
    'watch',
    'manifest',
  ] as const satisfies readonly t.Files.Capability.Name[],
} as const;

/** Short local alias for module defaults. */
export const D = DEFAULTS;
