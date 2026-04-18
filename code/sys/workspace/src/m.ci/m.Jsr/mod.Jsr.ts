import type { t } from '../common.ts';
import { Is } from './mod.Is.ts';
import { sync } from './u.sync.ts';
import { text } from './u.text.ts';
import { write } from './u.write.ts';

export const Jsr: t.WorkspaceCi.Jsr.Lib = { Is, text, write, sync };
