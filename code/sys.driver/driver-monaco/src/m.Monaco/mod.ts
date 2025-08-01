/**
 * Code editor.
 * @module
 */
import type { t } from './common.ts';

import { PathView } from '../ui/common.ts';
import { EditorCarets as Carets } from '../ui/m.Carets/mod.ts';
import { EditorCrdt as Crdt } from '../ui/m.Crdt/mod.ts';
import { EditorFolding as Folding } from '../ui/m.Folding/mod.ts';
import { EditorYaml as Yaml } from '../ui/m.Yaml/mod.ts';
import { MonacoEditor as Editor } from '../ui/ui.MonacoEditor/mod.ts';
import { MonacoIs } from './m.Is.ts';

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
  Folding,
  Dev: { PathView },
} as const;
