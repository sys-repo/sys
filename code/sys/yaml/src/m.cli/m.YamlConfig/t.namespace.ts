import type { t } from './common.ts';

/**
 * Yaml as a configuration store.
 */
export namespace YamlConfig {
  export type File = t.YamlConfigFile;
  export namespace Migrate {
    export type DirResult = t.YamlConfigFileMigrateDirResult;
  }
}
