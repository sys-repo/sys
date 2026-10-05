import type { AutomergeUrl, SharePolicy } from '@automerge/automerge-repo';
import type { t } from './common.ts';

/**
 * CRDT sync-server contracts.
 */
export declare namespace SyncServer {
  /** Tools for working with CRDT sync servers. */
  export type Lib = {
    /** Probe a sync-server and resolve with its handshake HTTP header info. */
    readonly probe: Probe.Fn;

    /** Start a new WebSocket CRDT synchronization server. */
    ws(options?: StartOptions): Promise<Instance>;
  };

  /** Options passed to the sync server start method. */
  export type StartOptions = {
    host?: string;
    port?: t.PortNumber;
    dir?: t.StringDir;
    keyboard?: boolean;
    keepAliveInterval?: t.Msecs;
    sharePolicy?: SharePolicy;
    denylist?: AutomergeUrl[];
    maxClients?: number;
    maxPayload?: number;
    silent?: boolean;
    until?: t.UntilInput;
  };

  /** Response from starting a new sync server. */
  export type Instance = t.LifecycleAsync & {
    readonly repo: t.CrdtRepo;
    readonly addr: Deno.NetAddr;
    readonly url: t.StringUrl;
  };

  /** Sync server command-line arguments. */
  export type Args = {
    host?: string;
    port?: number;
    dir?: t.StringDir;
    silent?: boolean;
  };

  /** JSON returned from HTTP/GET to the sync-server endpoint. */
  export type Info = {
    readonly pkg: t.Pkg;
    readonly total: {
      readonly connections: number;
      readonly idle: {
        readonly soft: number;
        readonly stale: number;
        readonly dead: number;
      };
    };
  };

  /**
   * Sync-server handshake contracts.
   */
  export namespace Handshake {
    /** Headers returned by the sync server on WebSocket upgrade. */
    export type Headers = {
      upgrade: 'websocket';
      connection: 'Upgrade';
      /** Ambient server header; not guaranteed across runtimes. */
      date?: t.StringHttpDate;
      'sys-pkg': t.StringScopedPkgNameVer;
      'sec-websocket-accept': string;
    };
  }

  /**
   * Sync-server probe contracts.
   */
  export namespace Probe {
    /** Probe a sync-server and resolve with its handshake HTTP header info. */
    export type Fn = (url: string, options?: { timeout?: t.Msecs }) => Promise<Response>;

    /** Result of probing a sync server. */
    export type Response = {
      readonly url: t.StringUrl;
      readonly headers: Handshake.Headers;
      readonly pkg: t.Pkg;
      readonly elapsed: t.Msecs;
      readonly errors: t.StdError[];
    };
  }
}
