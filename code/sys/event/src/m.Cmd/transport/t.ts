/**
 * Minimal "MessagePort-like" type.
 */
export type CmdMessagePort = {
  postMessage: (data: unknown) => void;
  addEventListener: (type: 'message', handler: (event: { data: unknown }) => void) => void;
  start?: () => void;
  close?: () => void;
};
