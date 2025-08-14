/**
 * Code editor.
 * @module
 */
import type { t } from './common.ts';

import { EditorCrdt as Crdt } from '../ui/m.Crdt/mod.ts';
import { EditorYaml as Yaml } from '../ui/m.Yaml/mod.ts';
import { MonacoEditor as Editor } from '../ui/ui.Editor.Monaco/mod.ts';
import { MonacoIs } from './m.Is.ts';
import { Link } from './m.Link.ts';

export { MonacoIs };

/**
 * Code editor library:
 */
export const Monaco: t.MonacoLib = {
  get Is() {
    return MonacoIs;
  },
  get Editor() {
    return Editor;
  },
  get Crdt() {
    return Crdt;
  },
  get Yaml() {
    return Yaml;
  },
  get Link() {
    return Link;
  },
} as const;
