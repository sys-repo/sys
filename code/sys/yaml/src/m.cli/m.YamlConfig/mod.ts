/**
 * YAML config helpers for CLI modules.
 */
import type { t } from './common.ts';
import { File } from './m.File.ts';
import { menu } from './u.menu.ts';

export const YamlConfig: t.YamlConfigLib = { menu, File };
