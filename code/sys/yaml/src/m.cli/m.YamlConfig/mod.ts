/**
 * @module
 * YAML config file, edit, ref, env, and interactive menu helpers.
 */
import type { t } from './common.ts';
import { Edit } from './m/m.Edit.ts';
import { Env } from './m/m.Env.ts';
import { File } from './m/m.File.ts';
import { Ref } from './m/m.Ref.ts';
import { menu } from './u.menu/u.ts';

/** YAML config file, edit, ref, env, and interactive menu helpers. */
export const YamlConfig: t.YamlConfig.Lib = Object.freeze({
  File,
  Edit,
  Ref,
  Env,
  menu,
});
