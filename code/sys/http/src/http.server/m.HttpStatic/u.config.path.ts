import { pkg, type t, YamlConfig } from './common.ts';

const ROOT = YamlConfig.File.fromPkg('-config' as t.StringDir, pkg).dir.path;

/** Static HTTP server durable config path conventions. */
export const StaticConfigPath = Object.freeze({
  root: ROOT as t.StringDir,
  dir: `${ROOT}/static` as t.StringDir,
  example: `${ROOT}/static/view.yaml` as t.StringPath,
});
