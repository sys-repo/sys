import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.edit.ts';
export type * from './t.file.ts';
export type * from './t.menu.ts';
export type * from './t.namespace.ts';
export type * from './t.ref.ts';

/** YAML config CLI library surface. */
export type YamlConfigLib = {
  readonly File: t.YamlConfigFileLib;
  readonly Edit: t.YamlConfigEditLib;
  readonly Ref: t.YamlConfigRefLib;
  readonly menu: t.YamlConfigMenu;
};
