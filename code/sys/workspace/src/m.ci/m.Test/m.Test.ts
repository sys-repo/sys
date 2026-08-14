import type { t } from '../common.ts';
import { sync } from './u.sync.ts';
import { text } from './u.text.ts';
import { write } from './u.write.ts';

export const Test: t.WorkspaceCi.Test.Lib = Object.freeze({ text, write, sync });
