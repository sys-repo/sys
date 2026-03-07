import type { t } from '../common.ts';
import { text } from './u.text.ts';
import { write } from './u.write.ts';

export const Build: t.MonorepoCi.Build.Lib = { text, write };
