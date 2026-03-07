/**
 * @module
 */
import type { t } from './common.ts';
import { BulletList as UI } from './ui.tsx';
import { toggle } from './u.toggle.ts';

export const BulletList: t.BulletList.Lib = { UI, toggle };
