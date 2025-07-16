/**
 * Code editor.
 * @module
 */
import type { t } from './common.ts';

import { EditorCarets as Carets } from '../ui/m.Carets/mod.ts';
import { EditorCrdt as Crdt, useBinding } from '../ui/m.Crdt/mod.ts';
import { EditorYaml as Yaml } from '../ui/m.Yaml/mod.ts';
import { MonacoEditor as Editor } from '../ui/ui.MonacoEditor/mod.ts';
import { MonacoIs } from './m.Is.ts';

export { Wrangle } from './u.Wrangle.ts';
export { MonacoIs };

/**
 * Code editor library:
 */
export const Monaco: t.MonacoLib = {
  Is: MonacoIs,
  Editor,
  Carets,
  Yaml,
  Crdt,
  useBinding,
} as const;
