import { pkg } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';

const ROOT = YamlConfig.File.fromPkg('-config', pkg).dir.name;

export const PiFs = {
  root: ROOT,
  configDir: `-config/${ROOT}.pi`,
  logDir: `.log/${ROOT}.pi`,
} as const;
