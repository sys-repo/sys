import type { t } from './common.ts';

/**
 * Files server facades over bounded Files model backings.
 */
export declare namespace FilesServer {
  /** Public Files server facade surface. */
  export type Lib = {
    /** HTTP projections for bounded Files backings. */
    readonly Http: Http.Lib;

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
    readonly handlers: t.Files.Cmd.HandlerMap;
  };

  /** HTTP projections for bounded Files backings. */
  export namespace Http {
    /** Public Files HTTP projection surface. */
    export type Lib = {
      /** Create a GET JSON projection of the Files manifest command when supported. */
      readonly manifest: (options: ManifestOptions) => ManifestProjection | undefined;
    };

    /** Options for creating a manifest HTTP projection. */
    export type ManifestOptions = {
      /** Bounded Files backing to project. */
      readonly files: FilesServer.Backing;

      /** Base Files HTTP/WebSocket path. Defaults to the Files server path. */
      readonly path?: t.StringUrlRoute;
    };

    /** GET JSON projection of a bounded Files manifest. */
    export type ManifestProjection = {
      /** Derived manifest route, e.g. `/files/manifest`. */
      readonly path: t.StringUrlRoute;

      /** Status URL label for owner service reporting. */
      readonly label: 'files:manifest';

      /** True when the request targets this projection path. */
      readonly matches: (request: Request) => boolean;

      /** Build the HTTP response for a matching request. */
      readonly response: (request: Request) => Promise<Response>;
    };
  }

  /** WebSocket service facade. */
  export namespace WebSocket {
    /** Public WebSocket facade surface. */
    export type Lib = {
      /** Create a running Files/WebSocket service with caller-owned lifecycle. */
      readonly create: (options: CreateOptions) => t.WebSocketServer.Started;

      /** Hosted startup convenience for a Files/WebSocket service. */
      readonly start: (options: StartOptions) => t.WebSocketServer.Started;
    };

    /** Base WebSocket options accepted by the Files facade. */
    export type WebSocketOptions = Omit<
      t.WebSocketServer.CreateOptions<
        t.Files.Cmd.Name,
        t.Files.Cmd.Payload,
        t.Files.Cmd.Result,
        t.Files.Cmd.Event
      >,
      'cmd' | 'status' | 'http'
    >;

    /** Options for creating a Files/WebSocket service with caller-owned lifecycle. */
    export type CreateOptions = WebSocketOptions & {
      /** Bounded Files backing to expose over Cmd/WebSocket. */
      readonly files: FilesServer.Backing;

      /** Structured, renderer-neutral status metadata for the running service handle. */
      readonly status?: StatusOptions;
    };

    /** Hosted startup controls inherited from the WebSocket server primitive. */
    export type HostedOptions = Pick<
      t.WebSocketServer.StartOptions<
        t.Files.Cmd.Name,
        t.Files.Cmd.Payload,
        t.Files.Cmd.Result,
        t.Files.Cmd.Event
      >,
      'lifecycle' | 'silent' | 'keyboard'
    >;

    /** Options for hosted Files/WebSocket service startup. */
    export type StartOptions = CreateOptions & HostedOptions;

    /** Running Files/WebSocket service handle. */
    export type Started = t.WebSocketServer.Started;

    /** Status metadata accepted by the Files WebSocket facade. */
    export type StatusOptions = t.WebSocketServer.StatusOptions;
  }
}
