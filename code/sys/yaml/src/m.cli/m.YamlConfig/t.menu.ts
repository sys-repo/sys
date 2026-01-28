import type { t } from './common.ts';

/** Base actions supported by the YAML config menu. */
export type YamlConfigMenuActionBase = 'back' | 'delete' | 'edit' | 'rename' | 'reload' | 'exit';

/** Schema helpers injected by the caller. */
export type YamlConfigSchema<T> = {
  init: () => T;
  validate: (value: unknown) => { ok: boolean; errors: readonly unknown[] };
  stringifyYaml?: (doc: T) => string;
};

/** Menu item label. */
export type YamlConfigMenuItemName<T = unknown> = string | YamlConfigMenuItemNameFn<T>;
export type YamlConfigMenuItemNameFn<T = unknown> = (args: YamlConfigMenuItemArgs<T>) => string;
export type YamlConfigMenuItemArgs<T = unknown> = {
  readonly name: string;
  readonly path: t.StringFile;
  readonly doc?: T;
};

/** Extra actions injected by the caller. */
export type YamlConfigMenuExtra<A extends string = string, T = unknown> = {
  name: YamlConfigMenuItemName<T>;
  value: A;
};

/** Menu action handler result. */
export type YamlConfigMenuResult<A extends string = string> =
  | { kind: 'exit' }
  | { kind: 'back' }
  | { kind: 'stay' }
  | { kind: 'action'; action: A | YamlConfigMenuActionBase; path: t.StringFile };

/** Menu action handler callback. */
export type YamlConfigMenuHandler<A extends string = string> = (args: {
  action: A | YamlConfigMenuActionBase;
  path: t.StringFile;
}) => Promise<YamlConfigMenuResult<A>>;

/** Menu mode. */
export type YamlConfigMenuMode = 'menu' | 'action' | 'select';

/** YAML config menu args. */
export type YamlConfigMenuArgs<T, A extends string = string> = {
  cwd: t.StringDir;
  label: string;
  dir: t.StringPath;
  ext?: t.StringPath;
  mode?: YamlConfigMenuMode;
  path?: t.StringFile;
  defaultPath?: t.StringFile;
  defaultAction?: YamlConfigMenuActionBase | A;
  selectAction?: A;
  ensureDefault?: boolean;
  defaultName?: string;
  itemLabel?: string;
  addLabel?: string;
  exitLabel?: string;
  schema: YamlConfigSchema<T>;
  invalid?: { label?: string; allow?: YamlConfigMenuActionBase[] };
  actions?: { extra?: YamlConfigMenuExtra<A, T>[]; onAction?: YamlConfigMenuHandler<A> };
  add?: {
    message?: string;
    hint?: string;
    validate?: (value: string) => boolean | string | Promise<boolean | string>;
    initYaml?: (args: { name: string; doc: T }) => string;
  };
};

/** Menu prompt for YAML config files. */
export type YamlConfigMenu = <T, A extends string = string>(
  args: YamlConfigMenuArgs<T, A>,
) => Promise<YamlConfigMenuResult<A>>;
