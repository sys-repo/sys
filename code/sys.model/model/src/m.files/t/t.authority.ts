import type { t } from '../common.ts';
import type { FilesCapability } from './t.capability.ts';
import type { FilesCmd } from './t.cmd.ts';
import type { Core } from './t.u.core.ts';

/**
 * Resolved Files authority.
 *
 * Policy is human-authored input. Authority is runtime truth derived from
 * policy plus backing support facts.
 */
export declare namespace FilesAuthority {
  /** Runtime helper surface. */
  export type Lib = {
    /** Resolve a policy and backing support facts into one authority value. */
    readonly resolve: (input: ResolveInput) => Instance;
  };

  /** Inputs for resolving Files authority. */
  export type ResolveInput = {
    /** Human-authored Files policy; defaults to deny-all. */
    readonly policy?: t.FilesPolicy.Shape;
    /** Backing support facts. */
    readonly backing: BackingFacts;
    /** Error factories used by generated checks and handler gates. */
    readonly errors?: ErrorFactories;
  };

  /** Backing support facts that authority projects into capabilities. */
  export type BackingFacts = {
    /** Commands/features the backing can support before policy is applied. */
    readonly supports: Partial<FilesCapability.Map>;
    /** Backing/transport fidelity for this view. */
    readonly fidelity?: Core.Fidelity;
    /** Backing-level maximum inline read size. */
    readonly maxReadBytes?: t.NumberBytes;
    /** Inline encodings supported by this backing. */
    readonly encodings?: readonly Core.Encoding[];
  };

  /** Resolved runtime authority. */
  export type Instance = {
    /** Snapshotted policy used by this authority. */
    readonly policy: t.FilesPolicy.Shape;
    /** Normalized backing support facts. */
    readonly supports: FilesCapability.Map;
    /** Capability projection derived from backing facts and policy. */
    readonly capabilities: FilesCapability.Capabilities;
    /** True when the action is backed and policy grants the path/scope. */
    readonly allows: (action: Action, path?: Core.StringPath) => boolean;
    /** Throw when the action is unsupported or denied for the path/scope. */
    readonly check: (action: Action, path?: Core.StringPath) => void;
    /** Overlay authority gates onto a total Files handler map. */
    readonly handlers: (
      handlers: FilesCmd.HandlerMap,
      options?: HandlerOptions,
    ) => FilesCmd.HandlerMap;
  };

  /** Actions checked by resolved authority. */
  export type Action = FilesCapability.Name;

  /** Options for generated handler gates. */
  export type HandlerOptions = {
    /** Resolve the visible Files path/scope for a command payload. */
    readonly path?: PathResolver;
  };

  /** Resolve a visible Files path/scope for a command payload. */
  export type PathResolver = <K extends FilesCmd.Name>(
    args: PathResolverArgs<K>,
  ) => Core.StringPath | undefined;

  /** Input passed to path resolvers. */
  export type PathResolverArgs<K extends FilesCmd.Name> = {
    readonly name: K;
    readonly payload: FilesCmd.Payload[K];
  };

  /** Error factories for authority checks. */
  export type ErrorFactories = {
    /** Invalid authored input or backing facts. */
    readonly invalid?: (message: string) => Error;
    /** Command/action is not supported by the backing. */
    readonly unsupported?: (action: Action) => Error;
    /** Policy denies the action for a path/scope. */
    readonly denied?: (action: Action, path: Core.StringPath) => Error;
  };
}
