import { pkg, type t } from './common.ts';
import { YamlConfig } from '@sys/yaml/cli';

const ROOT = YamlConfig.File.fromPkg('-config' as t.StringDir, pkg).dir.path;

/** Static HTTP server durable config path conventions. */
export const StaticConfigPath = {
  root: ROOT as t.StringDir,
  dir: `${ROOT}/static` as t.StringDir,
  example: `${ROOT}/static/view.yaml` as t.StringPath,
} as const;
