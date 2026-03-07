import type { t } from '../common.ts';

/**
 * Transport adapters for wiring Cmd to various message endpoints.
 */
export type CmdTransportLib = {
  /** Adapt a WebSocket into a CmdEndpoint using JSON-encoded messages. */
  fromWebSocket(ws: WebSocket): t.CmdEndpoint;
};

/**
 * Minimal "MessagePort-like" type.
 */
export type CmdMessagePort = {
  postMessage: (data: unknown) => void;
  addEventListener: (type: 'message', handler: (event: { data: unknown }) => void) => void;
  start?: () => void;
  close?: () => void;
};
