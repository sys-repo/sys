import type { t } from '../common.ts';

/** Base actions supported by the YAML config menu. */
export type YamlConfigMenuActionBase = 'back' | 'delete' | 'edit' | 'rename' | 'reload' | 'exit';

/** Schema helpers injected by the caller. */
export type YamlConfigSchema<T> = {
  init?: () => T;
  validate: (value: unknown) => { ok: boolean; errors: readonly unknown[] };
  stringifyYaml?: (doc: T) => string;
};

/** Menu item label. */
export type YamlConfigMenuItemName<T = unknown> = string | YamlConfigMenuItemNameFn<T>;
/** Function that derives a menu item label from item context. */
export type YamlConfigMenuItemNameFn<T = unknown> = (args: YamlConfigMenuItemArgs<T>) => string;
/** Context supplied while deriving a YAML config menu item. */
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
  /** Base working directory for config resolution. */
  cwd: t.StringDir;
  /** Menu title (prompt header). */
  label: string;
  /** Relative directory containing YAML configs. */
  dir: t.StringPath;
  /** File extension (default: ".yaml"). */
  ext?: t.StringPath;
  /** Leading indent for add/item rows (default: " "). */
  indent?: string;
  /** Menu mode (menu/action/select). */
  mode?: YamlConfigMenuMode;
  /** File path used for action mode. */
  path?: t.StringFile;
  /** Default selected file path. */
  defaultPath?: t.StringFile;
  /** Default action when re-entering action mode. */
  defaultAction?: YamlConfigMenuActionBase | A;
  /** Action value returned for select mode. */
  selectAction?: A;
  /** Create default config if none exist (default: true). */
  ensureDefault?: boolean;
  /** Default filename base used when creating the first config. */
  defaultName?: string;
  /** Label for the add row (e.g. "add: <config>"). */
  addLabel?: string;
  /** Label for the exit row (default: "(exit)"). */
  exitLabel?: string;
  /** Left-hand label before the tree glyphs. May derive from the item YAML doc. */
  itemLabel?: YamlConfigMenuItemName<T>;
  /** Right-hand item text. Defaults to filename and may derive from the item YAML doc. */
  itemValue?: YamlConfigMenuItemName<T>;
  /** Schema helpers for init/validate/stringify. */
  schema: YamlConfigSchema<T>;
  /** Invalid YAML handling (label + allowed actions). */
  invalid?: { label?: string; allow?: YamlConfigMenuActionBase[] };
  /** Extra actions and handler hook. */
  actions?: {
    /** Action prompt message (default: "Actions:"). */
    message?: string;
    /**
     * Label used for built-in edit/reload/rename actions.
     * Defaults to `config` and may derive from the selected config context.
     */
    label?: YamlConfigMenuItemName<T>;
    /**
     * Present labeled edit/reload/rename actions as prefixed rows or within a submenu.
     * Defaults to `prefix`; delete and back remain in the parent action menu.
     */
    labelMode?: 'prefix' | 'submenu';
    extra?: YamlConfigMenuExtra<A, T>[];
    /** Extra actions placed after built-in edit/reload/rename and before delete. */
    extraAfter?: YamlConfigMenuExtra<A, T>[];
    onAction?: YamlConfigMenuHandler<A>;
  };
  /** Add prompt configuration. */
  add?: {
    /** Prompt message (default: "Config name"). */
    message?: string;
    /** Prompt hint text. */
    hint?: string;
    /** Name validation hook. */
    validate?: (value: string) => boolean | string | Promise<boolean | string>;
    /** Initial YAML rendering hook. */
    initYaml?: (args: { name: string; doc?: T }) => string;
  };
};

/** Menu prompt for YAML config files. */
export type YamlConfigMenu = <T, A extends string = string>(
  args: YamlConfigMenuArgs<T, A>,
) => Promise<YamlConfigMenuResult<A>>;
