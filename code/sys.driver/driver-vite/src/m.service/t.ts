import type { t } from './common.ts';

/**
 * Cell-compatible lifecycle service endpoint owned by `@sys/driver-vite`.
 */
export declare namespace ViteService {
  /** Public Cell lifecycle endpoint surface. */
  export type Lib = t.Service.LifecycleEndpoint<StartArgs, DevHandle> & {
    /** Declare configured resources without starting Vite. */
    resources(args: t.Service.Resource.Args): Promise<readonly t.Service.Resource.Any[]>;
  };

  /** Cell lifecycle start args accepted by the Vite dev service endpoint. */
  export type StartArgs = {
    /** Cell root folder supplied by the orchestrator. */
    readonly cwd: t.StringDir;
    /** Owner config refs supplied by the orchestrator. */
    readonly paths: { readonly config: t.StringPath };
    /** Suppress owner-local startup output; the orchestrator renders status. */
    readonly silent?: boolean;
    /** Canonical lifecycle bridge supplied by the orchestrator. */
    readonly until?: t.UntilInput;
  };

  /** YAML-authored Vite dev service owner config. */
  export type Config = {
    /** Optional owner-local display name. */
    readonly name?: string;
    /** Vite project directory, resolved relative to `StartArgs.cwd`. Defaults to `.`. */
    readonly dir?: t.StringDir;
    /** Preferred dev-server port for this service binding. */
    readonly port?: number;
  };

  /** Resolved Vite dev service location. */
  export type Location = {
    /** Optional owner-local display name. */
    readonly name?: string;
    /** Cell root folder supplied by the orchestrator. */
    readonly cwd: t.StringDir;
    /** Absolute owner config path. */
    readonly config: t.StringPath;
    /** Absolute Vite project directory. */
    readonly dir: t.StringDir;
    /** Preferred dev-server port, when configured. */
    readonly port?: number;
  };

  /** Running Vite dev service handle. */
  export type DevHandle = t.Service.Handle & {
    /** Resolved Vite dev service location. */
    readonly location: Location;
    /** Absolute Vite project directory. */
    readonly cwd: t.StringDir;
    /** Absolute owner config path. */
    readonly config: t.StringPath;
    /** Running Vite process handle. */
    readonly server: t.Vite.Dev.Process;
    /** Actual resolved dev-server port. */
    readonly port: number;
    /** Actual resolved dev-server URL. */
    readonly url: t.StringUrl;
    /** Resolves after the service is closed/disposed. */
    readonly finished: Promise<void>;
    /** Close the running service. */
    close(reason?: unknown): Promise<void>;
    /** Dispose the running service. */
    dispose(reason?: unknown): Promise<void>;
    /** Renderer-neutral owner status snapshot. */
    status(): t.Service.Status;
  };

  /** Test seam for the thin service adapter. */
  export type StartDevDeps = {
    readonly dev?: t.Vite.Lib['dev'];
  };
}
