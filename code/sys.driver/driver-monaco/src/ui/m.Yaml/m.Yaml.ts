import { useErrorMarkers } from '../m.Markers.Error/mod.ts';
import { YamlEditor as Editor } from '../ui.YamlEditor/ui.tsx';

import type { t } from './common.ts';
import { Error } from './m.Error.ts';
import { Path } from './m.Path.ts';
import { useYaml } from './use.Yaml.ts';

export const EditorYaml: t.EditorYamlLib = {
  Path,
  Editor,
  Error,
  useYaml,

  /**
   * TODO 🐷 move elsewhere
   */
  useErrorMarkers,
};
