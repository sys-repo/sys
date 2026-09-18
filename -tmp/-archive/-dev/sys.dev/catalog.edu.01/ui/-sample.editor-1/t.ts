import type { t } from './common.ts';

/**
 * Component:
 */
export type Sample1Props = {
  bus$?: t.EditorEventBus;
  repo?: t.Crdt.Repo;
  signals?: Partial<t.YamlEditorSignals>;
  storageKey?: t.StringId;

  /** Path to the YAML text in the CRDT doc (editor binds to this). */
  docPath?: t.ObjectPath;
  /** Path within the YAML AST to the slug root (validators/hooks use this). */
  slugPath?: t.ObjectPath;

  // Appearance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onDiagnostics?: (e: { slugDiagnostics: t.Ary<t.Yaml.Diagnostic> }) => void;
};
