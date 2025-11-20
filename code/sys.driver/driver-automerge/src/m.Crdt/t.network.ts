import type { t } from './common.ts';

/**
 * A string representing a "wss://" network endpoint.
 */
export type StringWebsocketEndpoint = string;

/**
 * Represents the configuration for a sync-server running over websockets.
 */
export type CrdtWebsocketNetworkArg = { ws: t.StringWebsocketEndpoint };
