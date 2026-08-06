import type { t } from './common.ts';

/**
 * Cell-compatible checksum-pinned Dist service contracts.
 */
export declare namespace DistService {
  /** Public Cell lifecycle endpoint surface. */
  export type Lib = {
    readonly start: Start;
    readonly resources: Resources;
  };

  /** Start one configured checksum-pinned Dist service. */
  export type Start = (args: StartArgs) => Promise<t.HttpServer.Started>;

  /** Declare configured resources without starting the service. */
  export type Resources = (
    args: t.Service.Resource.Args,
  ) => Promise<readonly t.Service.Resource.Any[]>;

  /** Cell lifecycle start args accepted by the Dist service endpoint. */
  export type StartArgs = {
    /** Cell/service root supplied by the orchestrator. */
    cwd: t.StringDir;
    /** Owner config refs supplied by the orchestrator. */
    paths: { config: t.StringPath };
    /** Cell-owned startup-output policy. */
    silent?: boolean;
    /** Cell-owned lifecycle authority. */
    until?: t.UntilInput;
  };

  /** Strict normalized YAML configuration. */
  export type Config = Readonly<{
    name?: string;
    dir: t.StringDir;
    integrity: t.StringHash;
    limits: Readonly<t.FsPkg.Dist.Pinned.Verify.Limits>;
    hostname?: t.StringHostname;
    port?: t.PortNumber;
  }>;
}
