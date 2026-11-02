/**
 * @module
 * Dev-only React composition primitives built from system UI components.
 */
import type { t } from './common.ts';
import { DevHelp as Help } from './m.Help/mod.ts';
import { DevButton as Button } from './ui.Button.tsx';

/** Dev-only composition primitive surface. */
export const Dev: t.Dev.Lib = { Help, Button };
