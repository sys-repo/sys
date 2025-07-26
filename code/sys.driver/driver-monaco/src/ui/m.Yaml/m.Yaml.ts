import type { t } from './common.ts';
import { Path } from './m.Path.ts';
import { useYaml } from './use.Yaml.ts';
import { useErrorMarkers } from './use.ErrorMarkers.ts';

export const EditorYaml: t.EditorYamlLib = {
  Path,
  useYaml,
  useErrorMarkers,
};
