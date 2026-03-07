import { type t, pkg, Pkg } from '../common.ts';

export { Crdt } from '@sys/driver-automerge/web/ui';
export { Monaco } from '../../m.Monaco/mod.ts';

export * from '../common.ts';
export { YamlEditorFooter } from '../ui.YamlEditor.Footer/mod.ts';

type P = t.YamlEditorProps;

/**
 * Constants:
 */
const name = 'Monaco.YamlEditor';
const documentId: t.YamlEditorDocumentIdProps = { visible: true, readOnly: false };
const footer: P['footer'] = { visible: true };

export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  documentId,
  footer,
  diagnostics: 'syntax' satisfies t.YamlEditorDiagnostics,
  debounce: 40,
} as const;
export const D = DEFAULTS;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
