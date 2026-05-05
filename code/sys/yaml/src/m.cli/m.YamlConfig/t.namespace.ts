import type { t } from './common.ts';

/**
 * Yaml as a configuration store.
 */
export namespace YamlConfig {
  export type File = t.YamlConfigFile;

  export namespace Edit {
    export type Context = t.YamlConfigEditContext;
    export type Input<TDoc, TChange> = t.YamlConfigEditInput<TDoc, TChange>;
    export type Mutation<TDoc, TChange> = t.YamlConfigEditMutation<TDoc, TChange>;
    export type Result<TChange> = t.YamlConfigEditResult<TChange>;
  }

  export namespace Migrate {
    export type DirResult = t.YamlConfigFileMigrateDirResult;
  }
}
