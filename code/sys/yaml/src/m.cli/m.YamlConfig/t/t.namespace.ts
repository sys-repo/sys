import type { t } from '../common.ts';

/**
 * Yaml as a configuration store.
 */
export namespace YamlConfig {
  /** YAML config CLI library surface. */
  export type Lib = {
    readonly File: File.Lib;
    readonly Edit: Edit.Lib;
    readonly Ref: Ref.Lib;
    readonly menu: Menu.Run;
  };

  /** Config file roots and migration helpers. */
  export namespace File {
    export type Lib = t.YamlConfigFileLib;
    export type Root = t.YamlConfigFile;
    export type MigrateDirResult = t.YamlConfigFileMigrateDirResult;
  }

  /** Owner config edit transaction helpers. */
  export namespace Edit {
    export type Lib = t.YamlConfigEditLib;
    export type Context = t.YamlConfigEditContext;
    export type Input<TDoc, TChange> = t.YamlConfigEditInput<TDoc, TChange>;
    export type Mutation<TDoc, TChange> = t.YamlConfigEditMutation<TDoc, TChange>;
    export type Result<TChange> = t.YamlConfigEditResult<TChange>;
  }

  /** Back-compat migration namespace. Prefer `YamlConfig.File.MigrateDirResult`. */
  export namespace Migrate {
    export type DirResult = File.MigrateDirResult;
  }

  /** Config selector helpers. */
  export namespace Ref {
    export type Lib = t.YamlConfigRefLib;
    export type Resolved = t.YamlConfigRef;
    export type Input = t.YamlConfigRefResolveInput;
  }

  /** Interactive YAML config menu helpers. */
  export namespace Menu {
    export type Run = t.YamlConfigMenu;
    export type ActionBase = t.YamlConfigMenuActionBase;
    export type Schema<T> = t.YamlConfigSchema<T>;
    export type ItemName<T = unknown> = t.YamlConfigMenuItemName<T>;
    export type ItemNameFn<T = unknown> = t.YamlConfigMenuItemNameFn<T>;
    export type ItemArgs<T = unknown> = t.YamlConfigMenuItemArgs<T>;
    export type Extra<A extends string = string, T = unknown> = t.YamlConfigMenuExtra<A, T>;
    export type Result<A extends string = string> = t.YamlConfigMenuResult<A>;
    export type Handler<A extends string = string> = t.YamlConfigMenuHandler<A>;
    export type Mode = t.YamlConfigMenuMode;
    export type Args<T, A extends string = string> = t.YamlConfigMenuArgs<T, A>;
  }
}
