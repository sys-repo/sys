import type { t } from './common.ts';

export type * from './t/t.port.ts';
export type * from './t/t.connect.ts';

/**
 * Tools for working with a network.
 */
export type NetLib = {
  readonly Port: t.PortLib;
  readonly port: t.PortLib['get'];

  /**
   */

  connect(port: t.PortNumber, options?: t.NetConnectOptions): Promise<t.NetConnectResponse>;
  toUrl(addr: Deno.NetAddr, kind?: 'http' | 'ws'): string;
};

/**
 * Targets that can be waited on with `Net.waitFor`.
 * Starts with WebSocket and can be extended over time.
 */
