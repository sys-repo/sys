/**
 * Cell help resource types.
 */
export declare namespace CellHelp {
  /** Runtime surface for bundled Cell help resources. */
  export type Lib = {
    readonly Root: Root.Lib;
    readonly Init: Init.Lib;
    readonly Agent: Agent.Lib;
  };

  /** Help command name/description pair. */
  export type Pair = readonly [string, string];

  /** Root CLI help resources. */
  export namespace Root {
    /** Loader for authored root help. */
    export type Lib = {
      /** Load authored root help from the embedded bundle. */
      load(): Promise<Guidance>;
    };

    /** Authored root help used by CLI composition. */
    export type Guidance = {
      readonly summary: string;
      readonly usage: readonly string[];
      readonly commands: readonly Pair[];
      readonly options: readonly Pair[];
    };
  }

  /** Init command help resources. */
  export namespace Init {
    /** Loader for authored init help. */
    export type Lib = {
      /** Load authored init help from the embedded bundle. */
      load(): Promise<Guidance>;
    };

    /** Authored init help used by CLI composition. */
    export type Guidance = {
      readonly summary: string;
      readonly usage: readonly string[];
      readonly options: readonly Pair[];
      readonly safety: readonly string[];
    };
  }

  /** Coding-agent guidance resources. */
  export namespace Agent {
    /** Loader for authored agent guidance. */
    export type Lib = {
      /** Load authored agent guidance from the embedded bundle. */
      load(): Promise<Guidance>;
    };

    /** Authored guidance used by CLI composition. */
    export type Guidance = {
      readonly intro: string;
      readonly init: readonly string[];
      readonly preserve: readonly string[];
      readonly rule: readonly string[];
      readonly speechActs: readonly string[];
      readonly ownerFlows: readonly string[];
      readonly actMapping: readonly string[];
    };
  }
}
