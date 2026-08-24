import type { t } from '../common.ts';
import { sync } from './u.sync.ts';
import { text } from './u.text.ts';
import { write } from './u.write.ts';

export const Linux: t.WorkspaceCi.Test.Linux.Lib = Object.freeze({ text, write, sync });
