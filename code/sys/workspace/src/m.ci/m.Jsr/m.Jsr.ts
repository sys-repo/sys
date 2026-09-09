import type { t } from '../common.ts';
import { Is } from './m.Is.ts';
import { sync } from './u/u.sync.ts';
import { text } from './u/u.text.ts';
import { write } from './u/u.write.ts';

export const Jsr: t.WorkspaceCi.Jsr.Lib = Object.freeze({ Is, text, write, sync });
