import { YamlEditor as Editor } from '../ui.YamlEditor/ui.tsx';

import type { t } from './common.ts';
import { Error } from './m.Error.ts';
import { Path } from './m.Path.ts';
import { useErrorMarkers } from './use.ErrorMarkers.ts';
import { useYaml } from './use.Yaml.ts';

export const EditorYaml: t.EditorYamlLib = {
  Path,
  Editor,
  Error,
  useYaml,
  useErrorMarkers,
};
