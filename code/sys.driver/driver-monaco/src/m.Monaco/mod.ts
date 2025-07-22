/**
 * Code editor.
 * @module
 */
import type { t } from './common.ts';

import { PathView } from '../ui/common.ts';
import { EditorCarets as Carets } from '../ui/m.Carets/mod.ts';
import { EditorCrdt as Crdt, useBinding } from '../ui/m.Crdt/mod.ts';
import { EditorHidden as Hidden } from '../ui/m.Hidden/mod.ts';
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
  Hidden,
  useBinding,
  Dev: { PathView },
} as const;
