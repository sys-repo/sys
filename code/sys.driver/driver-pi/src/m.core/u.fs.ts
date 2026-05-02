import { pkg } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';

const ROOT = YamlConfig.File.fromPkg('-config', pkg).dir.name;
const LEGACY_ROOT = `${ROOT}.pi` as const;

export const PiFs = {
  root: ROOT,
  configDir: `-config/${ROOT}`,
  logDir: `.log/${ROOT}`,
  legacy: {
    root: LEGACY_ROOT,
    configDir: `-config/${LEGACY_ROOT}`,
    logDir: `.log/${LEGACY_ROOT}`,
  },
} as const;
