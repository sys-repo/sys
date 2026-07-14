/**
 * @module
 * KeyValue-shaped switches for labeled boolean controls.
 */
import type { t } from './common.ts';
import { Switches as UI } from './ui.tsx';
import { SwitchesIs as Is } from './u.is.ts';
import { toItem, toItems } from './u.items.tsx';

export const Switches: t.KeyValue.Switches.Lib = { UI, toItem, toItems, Is };
