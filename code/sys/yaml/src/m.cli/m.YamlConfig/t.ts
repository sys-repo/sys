import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.edit.ts';
export type * from './t.file.ts';
export type * from './t.menu.ts';
export type * from './t.namespace.ts';
export type * from './t.ref.ts';

/** YAML config CLI library surface. Prefer `YamlConfig.Lib`. */
export type YamlConfigLib = t.YamlConfig.Lib;
