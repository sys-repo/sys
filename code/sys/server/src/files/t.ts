import type { t } from './common.ts';

/**
 * Files server facades over bounded Files model backings.
 */
export declare namespace FilesServer {
  /** Public Files server facade surface. */
  export type Lib = {
    /** WebSocket service facade for a Files Cmd backing. */
    readonly WebSocket: WebSocket.Lib;
  };

  /** Structural Files Cmd backing accepted by server facades. */
  export type Backing<K extends string = string> = {
    /** Backing kind, when surfaced as owner-local metadata. */
    readonly kind?: K;

    /** Capability facts for the bounded Files view. */
    readonly capabilities: t.Files.Capabilities;

    /** Canonical Files Cmd handlers. */
    readonly handlers: t.FilesCmd.HandlerMap;
  };

  /** WebSocket service facade. */
  export namespace WebSocket {
    /** Public WebSocket facade surface. */
    export type Lib = {
      /** Start a WebSocket Cmd service for a bounded Files backing. */
      readonly create: (options: CreateOptions) => t.WebSocketServer.Started;
    };

    /** Base WebSocket options accepted by the Files facade. */
    export type WebSocketOptions = Omit<
      t.WebSocketServer.CreateOptions<
        t.FilesCmd.Name,
        t.FilesCmd.Payload,
        t.FilesCmd.Result,
        t.FilesCmd.Event
      >,
      'cmd' | 'status'
    >;

    /** Options for starting a Files WebSocket service. */
    export type CreateOptions = WebSocketOptions & {
      /** Bounded Files backing to expose over Cmd/WebSocket. */
      readonly files: FilesServer.Backing;

      /** Structured, renderer-neutral status metadata for the running service handle. */
      readonly status?: StatusOptions;
    };

    /** Status metadata accepted by the Files WebSocket facade. */
    export type StatusOptions = t.WebSocketServer.StatusOptions;
  }
}
