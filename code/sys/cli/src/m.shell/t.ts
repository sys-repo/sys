/**
 * Pure shell profile planning types.
 */
export declare namespace Shell {
  /** Pure shell planning helper surface. */
  export type Lib = {
    /** Alias catalog and planning helpers. */
    readonly Alias: AliasLib;
    /** PATH catalog and planning helpers. */
    readonly Path: PathLib;
    /** Managed shell block helpers. */
    readonly Block: BlockLib;
    /** Whole-profile plan helpers. */
    readonly Plan: PlanLib;
  };

  /** Shell syntax family used for rendering managed snippets. */
  export type Dialect = 'posix' | 'zsh' | 'bash' | 'fish' | 'powershell';

  /** Write support available for a shell dialect. */
  export type Support = 'write' | 'doctor-only' | 'unsupported';

  /** Managed block owner metadata supplied by the product adapter. */
  export type Owner = {
    /** Stable machine-readable owner id. */
    readonly id: string;
    /** Human-readable owner label for comments and reports. */
    readonly label: string;
    /** Command hint printed in managed block comments. */
    readonly commandHint: string;
  };

  /** Stable alias catalog id. */
  export type AliasId = string;

  /** Stable PATH catalog id. */
  export type PathId = string;

  /** Alias entry intended for a managed shell block. */
  export type AliasEntry = {
    /** Stable alias catalog id. */
    readonly id: AliasId;
    /** Shell alias name. */
    readonly name: string;
    /** Shell command assigned to the alias. */
    readonly command: string;
    /** Alias collision risk. */
    readonly risk: 'safe' | 'shadowing';
    /** Optional catalog group name. */
    readonly group?: string;
  };

  /** PATH entry intended for a managed shell block. */
  export type PathEntry = {
    /** Stable PATH catalog id. */
    readonly id: PathId;
    /** Shell expression used in the generated PATH snippet. */
    readonly expression: string;
    /** Human-readable label for reports. */
    readonly label: string;
  };

  /** Desired managed shell block model. */
  export type ManagedModel = {
    /** Managed aliases. */
    readonly aliases: readonly AliasEntry[];
    /** Managed PATH entries. */
    readonly paths: readonly PathEntry[];
  };

  /** Existing managed block state detected within profile text. */
  export type BlockState =
    | { readonly kind: 'missing' }
    | { readonly kind: 'present'; readonly model: ManagedModel; readonly stale: boolean }
    | { readonly kind: 'invalid'; readonly reason: 'partial-markers' | 'multiple-blocks' };

  /** Planned text transform for one profile. */
  export type Plan = {
    /** Planned operation kind. */
    readonly kind: 'add' | 'replace' | 'remove' | 'unchanged';
    /** Existing managed block state. */
    readonly block: BlockState;
    /** Full profile text after applying the plan. */
    readonly nextText: string;
    /** Whether the plan changes the profile text. */
    readonly changed: boolean;
    /** Human-readable planning warnings. */
    readonly warnings: readonly string[];
  };

  /** Alias helper namespace. */
  export type AliasLib = Record<string, never>;

  /** PATH helper namespace. */
  export type PathLib = Record<string, never>;

  /** Managed block helper namespace. */
  export type BlockLib = Record<string, never>;

  /** Profile plan helper namespace. */
  export type PlanLib = Record<string, never>;
}
