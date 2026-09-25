import type { t } from '../common.ts';

/**
 * Yaml as a configuration store.
 */
export namespace YamlConfig {
  /** YAML config CLI API. */
  export type Lib = {
    /** Config file roots and migration helpers. */
    readonly File: File.Lib;
    /** Owner config edit transaction helpers. */
    readonly Edit: Edit.Lib;
    /** Config selector helpers. */
    readonly Ref: Ref.Lib;
    /** Dotenv-backed YAML config env-ref helpers. */
    readonly Env: Env.Lib;
    /** Run an interactive YAML config menu. */
    readonly menu: Menu.Run;
  };

  /** Config file roots and migration helpers. */
  export namespace File {
    /** Config file root naming and migration API. */
    export type Lib = t.YamlConfigFileLib;
    /** Config root descriptor. */
    export type Root = t.YamlConfigFile;
    /** Result from migrating config files between roots. */
    export type MigrateDirResult = t.YamlConfigFileMigrateDirResult;
  }

  /** Owner config edit transaction helpers. */
  export namespace Edit {
    /** Load/create, mutate, validate, and write transaction API. */
    export type Lib = t.YamlConfigEditLib;
    /** Context supplied to an owner config mutation. */
    export type Context = t.YamlConfigEditContext;
    /** Generic owner-config edit input. */
    export type Input<TDoc, TChange> = t.YamlConfigEditInput<TDoc, TChange>;
    /** Owner mutation output. */
    export type Mutation<TDoc, TChange> = t.YamlConfigEditMutation<TDoc, TChange>;
    /** Owner-config edit result. */
    export type Result<TChange> = t.YamlConfigEditResult<TChange>;
  }

  /** Back-compat migration namespace. Prefer `YamlConfig.File.MigrateDirResult`. */
  export namespace Migrate {
    /** Result from migrating config files between roots. */
    export type DirResult = File.MigrateDirResult;
  }

  /** Config selector helpers. */
  export namespace Ref {
    /** Config selector resolution API. */
    export type Lib = t.YamlConfigRefLib;
    /** Resolved config reference. */
    export type Resolved = t.YamlConfigRef;
    /** Input accepted by config reference resolution. */
    export type Input = t.YamlConfigRefResolveInput;
  }

  /** Dotenv-backed YAML config env-ref helpers. */
  export namespace Env {
    /** Dotenv-backed scalar env-ref resolver API. */
    export type Lib = t.YamlConfigEnv.Lib;
    /** `.env` file lookup strategy. */
    export type Search = t.YamlConfigEnv.Search;

    /** Dotenv-backed env-ref resolution contracts. */
    export namespace Resolve {
      /** Dotenv-backed env-ref resolver options. */
      export type Options = t.YamlConfigEnv.Resolve.Options;
      /** Dotenv-backed env-ref resolver result. */
      export type Result = t.YamlConfigEnv.Resolve.Result;
    }
  }

  /** Interactive YAML config menu helpers. */
  export namespace Menu {
    /** Interactive menu runner. */
    export type Run = t.YamlConfigMenu;
    /** Base action payload shared by menu actions. */
    export type ActionBase = t.YamlConfigMenuActionBase;
    /** Schema used to derive menu entries for a config document. */
    export type Schema<T> = t.YamlConfigSchema<T>;
    /** Static or derived display name for a menu item. */
    export type ItemName<T = unknown> = t.YamlConfigMenuItemName<T>;
    /** Function that derives a display name for a menu item. */
    export type ItemNameFn<T = unknown> = t.YamlConfigMenuItemNameFn<T>;
    /** Arguments supplied while deriving a menu item. */
    export type ItemArgs<T = unknown> = t.YamlConfigMenuItemArgs<T>;
    /** Extra action descriptor attached to the menu. */
    export type Extra<A extends string = string, T = unknown> = t.YamlConfigMenuExtra<A, T>;
    /** Result emitted by the interactive menu. */
    export type Result<A extends string = string> = t.YamlConfigMenuResult<A>;
    /** Handler invoked for menu actions. */
    export type Handler<A extends string = string> = t.YamlConfigMenuHandler<A>;
    /** Menu interaction mode. */
    export type Mode = t.YamlConfigMenuMode;
    /** Arguments passed to the menu runner. */
    export type Args<T, A extends string = string> = t.YamlConfigMenuArgs<T, A>;
  }
}
