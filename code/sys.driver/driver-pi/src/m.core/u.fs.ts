import { pkg, type t } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';

const ROOT = YamlConfig.File.fromPkg('-config', pkg).dir.name;
const PI_SYS_SEGMENTS = ['.pi', '@sys'] as const;
const PI_SYS_TMP_SEGMENTS = [...PI_SYS_SEGMENTS, 'tmp'] as const;
const PI_SYS_PATH = `${PI_SYS_SEGMENTS[0]}/${PI_SYS_SEGMENTS[1]}`;

export const PiFs = {
  root: ROOT,
  configDir: `-config/${ROOT}` as t.PiCliProfiles.Yaml.DirName,
  sysDirSegments: PI_SYS_SEGMENTS,
  sysTmpSegments: PI_SYS_TMP_SEGMENTS,
  logDir: `${PI_SYS_PATH}/log/${ROOT}` as t.StringPath,
  stateDir: `${PI_SYS_PATH}/state/${ROOT}` as t.StringPath,
} as const;
