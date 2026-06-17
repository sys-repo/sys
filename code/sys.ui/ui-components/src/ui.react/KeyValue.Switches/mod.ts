/**
 * @module
 * KeyValue-shaped switches for labeled boolean controls.
 */
import type { t } from './common.ts';
import { Switches as UI } from './ui.tsx';
import { toItem, toItems } from './u.items.tsx';

export const Switches: t.KeyValueSwitches.Lib = { UI, toItem, toItems };
