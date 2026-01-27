import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.menu.ts';

/** YAML config CLI library surface. */
export type YamlConfigLib = {
  readonly menu: t.YamlConfigMenu;
};
