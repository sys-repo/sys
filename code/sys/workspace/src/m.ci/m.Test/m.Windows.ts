import type { t } from '../common.ts';
import { sync } from './u.windows.sync.ts';
import { text } from './u.windows.text.ts';
import { write } from './u.windows.write.ts';

export const Windows: t.WorkspaceCi.Test.Windows.Lib = Object.freeze({ text, write, sync });
