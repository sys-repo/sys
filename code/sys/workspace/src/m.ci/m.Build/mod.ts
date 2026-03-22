import type { t } from '../common.ts';
import { sync } from './u.sync.ts';
import { text } from './u.text.ts';
import { write } from './u.write.ts';

export const Build: t.WorkspaceCi.Build.Lib = { text, write, sync };
