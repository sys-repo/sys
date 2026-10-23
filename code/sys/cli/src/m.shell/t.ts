/**
 * Pure shell profile planning types.
 */
export declare namespace Shell {
  /** Pure shell planning helper surface. */
  export type Lib = {
    /** Alias catalog and planning helpers. */
    readonly Alias: Alias.Lib;
    /** PATH catalog and planning helpers. */
    readonly Path: Path.Lib;
    /** Managed shell block helpers. */
    readonly Block: Block.Lib;
    /** Whole-profile plan helpers. */
    readonly Plan: Plan.Lib;
  };

  /** Shell syntax family used for planning shell support. */
  export type Dialect = 'posix' | 'zsh' | 'bash' | 'fish' | 'powershell';

  /** Shell dialects currently renderable by the managed-block helpers. */
  export type PosixDialect = 'posix' | 'zsh' | 'bash';

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

  /** Desired managed shell block model. */
  export type ManagedModel = {
    /** Managed aliases. */
    readonly aliases: readonly Alias.Entry[];
    /** Managed PATH entries. */
    readonly paths: readonly Path.Entry[];
  };

  /** Planned text transform for one profile. */
  export type Plan = {
    /** Planned operation kind. */
    readonly kind: 'add' | 'replace' | 'remove' | 'unchanged';
    /** Existing managed block state. */
    readonly block: Block.State;
    /** Full profile text after applying the plan. */
    readonly nextText: string;
    /** Whether the plan changes the profile text. */
    readonly changed: boolean;
    /** Human-readable planning warnings. */
    readonly warnings: readonly string[];
  };

  /**
   * Whole-profile plan helper types.
   */
  export namespace Plan {
    /** Whole-profile plan helper library contract. */
    export type Lib = Record<string, never>;
  }

  /** Alias catalog types. */
  export namespace Alias {
    /** Stable alias catalog id. */
    export type Id = string;

    /** Alias entry intended for a managed shell block. */
    export type Entry = {
      /** Stable alias catalog id. */
      readonly id: Id;
      /** Shell alias name. */
      readonly name: string;
      /** Shell command assigned to the alias. */
      readonly command: string;
      /** Alias collision risk. */
      readonly risk: 'safe' | 'shadowing';
    };

    /** Alias catalog helper namespace. */
    export type Lib = {
      /** List all known alias entries. */
      readonly list: () => readonly Entry[];
      /** Resolve one alias entry by id. */
      readonly get: (id: Id) => Entry | undefined;
      /** Resolve a named alias set. */
      readonly group: (id: GroupId) => readonly Entry[];
    };

    /** Known alias group id. */
    export type GroupId = 'sys' | 'common';
  }

  /** PATH catalog types. */
  export namespace Path {
    /** Stable PATH catalog id. */
    export type Id = string;

    /** PATH entry intended for a managed shell block. */
    export type Entry = {
      /** Stable PATH catalog id. */
      readonly id: Id;
      /** Shell expression used in the generated PATH snippet. */
      readonly expression: string;
      /** Human-readable label for reports. */
      readonly label: string;
    };

    /** PATH catalog helper namespace. */
    export type Lib = {
      /** List all known PATH entries. */
      readonly list: () => readonly Entry[];
      /** Resolve one PATH entry by id. */
      readonly get: (id: Id) => Entry | undefined;
    };
  }

  /** Managed block types. */
  export namespace Block {
    /** Managed block helper namespace. */
    export type Lib = {
      /** Build the owner-bound managed block markers. */
      readonly markers: (owner: Owner) => Markers;
      /** Render a deterministic managed block. */
      readonly render: (args: RenderArgs) => string;
      /** Detect the owner-bound managed block state in profile text. */
      readonly detect: (args: DetectArgs) => State;
      /** Add or replace the owner-bound managed block in profile text. */
      readonly update: (args: UpdateArgs) => Plan;
      /** Remove the owner-bound managed block from profile text. */
      readonly remove: (args: RemoveArgs) => Plan;
    };

    /** Existing managed block state detected within profile text. */
    export type State =
      | { readonly kind: 'missing' }
      | { readonly kind: 'present'; readonly model: ManagedModel; readonly stale: boolean }
      | { readonly kind: 'invalid'; readonly reason: 'partial-markers' | 'multiple-blocks' };

    /** Managed block marker pair. */
    export type Markers = {
      /** Opening marker line. */
      readonly start: string;
      /** Closing marker line. */
      readonly end: string;
    };

    /** Input for owner-bound block operations. */
    export type OwnerArgs = {
      /** Product owner metadata. */
      readonly owner: Owner;
    };

    /** Input for rendering a managed block. */
    export type RenderArgs = OwnerArgs & {
      /** POSIX-family shell dialect for rendering. */
      readonly dialect?: PosixDialect;
      /** Desired managed block model. */
      readonly model: ManagedModel;
      /** Line ending to use. */
      readonly newline?: '\n' | '\r\n';
    };

    /** Input for detecting a managed block in profile text. */
    export type DetectArgs = OwnerArgs & {
      /** Profile text to inspect. */
      readonly text: string;
    };

    /** Input for adding or replacing a managed block in profile text. */
    export type UpdateArgs = RenderArgs & {
      /** Existing profile text. */
      readonly text: string;
    };

    /** Input for removing a managed block from profile text. */
    export type RemoveArgs = OwnerArgs & {
      /** Existing profile text. */
      readonly text: string;
    };
  }
}
