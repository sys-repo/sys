import type { t } from './common.ts';

export type * from './t/t.port.ts';
export type * from './t/t.connect.ts';

/**
 * Tools for working with a network.
 */
export type NetLib = {
  /** Network port utilities. */
  readonly Port: t.PortLib;

  /** Retrieve an available port (alias of `Port.get`). */
  readonly port: t.PortLib['get'];

  /** Wait until a network target is ready (e.g. an open WebSocket). */
  waitFor(target: NetWaitTarget): Promise<void>;

  /** Attempt a TCP connection with retry and backoff. */
  connect(port: t.PortNumber, options?: t.NetConnectOptions): Promise<t.NetConnectResponse>;

  /** Format a network address as an http/https or ws/wss URL. */
  toUrl(addr: Deno.NetAddr, kind?: 'http' | 'ws'): string;
};

/**
 * Targets that can be waited on with `Net.waitFor`.
 * Starts with WebSocket and can be extended over time.
 */
export type NetWaitTarget = WebSocket;
