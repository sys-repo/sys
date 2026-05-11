/**
 * YAML config helpers for CLI modules.
 */
import type { t } from './common.ts';
import { Edit } from './m.Edit.ts';
import { File } from './m.File.ts';
import { Ref } from './m.Ref.ts';
import { menu } from './u.menu.ts';

export const YamlConfig: t.YamlConfig.Lib = { menu, File, Edit, Ref };
