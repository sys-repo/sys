import type { t } from '../common.ts';
import { Linux } from './m.Linux.ts';
import { Windows } from './m.Windows.ts';

export const Test: t.WorkspaceCi.Test.Lib = Object.freeze({ Linux, Windows });
