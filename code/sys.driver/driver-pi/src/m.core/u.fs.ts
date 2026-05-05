import { pkg } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';

const ROOT = YamlConfig.File.fromPkg('-config', pkg).dir.name;

export const PiFs = {
  root: ROOT,
  configDir: `-config/${ROOT}`,
  logDir: `.pi/@sys/log/${ROOT}`,
} as const;
