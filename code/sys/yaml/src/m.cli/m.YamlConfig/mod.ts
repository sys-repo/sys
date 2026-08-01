/**
 * YAML config helpers for CLI modules.
 */
import type { t } from './common.ts';
import { Edit } from './m.Edit.ts';
import { Env } from './m.Env.ts';
import { File } from './m.File.ts';
import { Ref } from './m.Ref.ts';
import { menu } from './u/u.menu.ts';

/** YAML config file, edit, ref, env, and interactive menu helpers. */
export const YamlConfig: t.YamlConfig.Lib = { menu, File, Edit, Ref, Env };
