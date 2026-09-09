import { pkg, type t, YamlConfig } from '../common.ts';

const ROOT = YamlConfig.File.fromPkg('-config' as t.StringDir, pkg).dir.path;

/** Reverse proxy durable config path conventions. */
export const ProxyConfigPath = Object.freeze({
  root: ROOT as t.StringDir,
  dir: `${ROOT}/proxy` as t.StringDir,
  example: `${ROOT}/proxy/app.yaml` as t.StringPath,
});
