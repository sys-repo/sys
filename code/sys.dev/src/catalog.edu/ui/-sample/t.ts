import type { t } from './common.ts';

/**
 * Component:
 */
export type SampleProps = {
  bus$?: t.EditorEventBus;
  repo?: t.Crdt.Repo;

  /** Path to the YAML text in the CRDT doc (editor binds to this). */
  docPath?: t.ObjectPath;
  /** Path within the YAML AST to the slug root (validators/hooks use this). */
  slugPath?: t.ObjectPath;

  signals?: Partial<t.YamlEditorSignals>;
  localstorage?: t.StringId;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
