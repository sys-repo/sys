import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t/t.edit.ts';
export type * from './t/t.file.ts';
export type * from './t/t.menu.ts';
export type * from './t/t.namespace.ts';
export type * from './t/t.ref.ts';

/** YAML config CLI library surface. Prefer `YamlConfig.Lib`. */
export type YamlConfigLib = t.YamlConfig.Lib;
