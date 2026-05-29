import type { t } from './common.ts';

/**
 * Cell-compatible Files WebSocket service endpoint.
 */
export declare namespace FilesWebSocketService {
  /** Public lifecycle endpoint surface. */
  export type Lib = t.Service.LifecycleEndpoint<StartArgs, t.FilesServer.WebSocket.Started> & {
    /** Declare configured resources without starting the service. */
    resources(args: t.Service.Resource.Args): Promise<readonly t.Service.Resource.Any[]>;
  };

  /** Cell lifecycle start args accepted by the Files WebSocket service endpoint. */
  export type StartArgs = {
    /** Cell/service root folder supplied by the orchestrator. */
    readonly cwd: t.StringDir;
    /** Owner config refs supplied by the orchestrator. */
    readonly paths: { readonly config: t.StringPath };
    /** Suppress owner-local startup output. Accepted for Cell compatibility; create is silent. */
    readonly silent?: boolean;
    /** Canonical lifecycle bridge supplied by the orchestrator. */
    readonly until?: t.UntilInput;
  };

  /** YAML-authored Files WebSocket service config. */
  export type Config = {
    /** Optional owner-local display name. */
    readonly name?: string;
    /** Files source root, resolved relative to `StartArgs.cwd`. */
    readonly root: string;
    /** Optional listen hostname. */
    readonly hostname?: t.StringHostname;
    /** Optional listen port. Use `0` for an ephemeral port. */
    readonly port?: t.PortNumber;
    /** WebSocket route accepted by the service. Defaults to `/files`. */
    readonly path: t.StringUrlRoute;
    /** Files policy selector. Defaults to `**`. */
    readonly policy: t.Files.Match;
    /** Whether to expose live watch capability. Defaults to `false`. */
    readonly watch: boolean;
  };
}
