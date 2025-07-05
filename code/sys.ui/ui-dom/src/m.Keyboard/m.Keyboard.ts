import type { t } from './common.ts';

import { KeyListener } from './m.KeyListener.ts';
import { KeyboardMonitor as Monitor } from './m.Keyboard.Monitor.ts';
import { dbl } from './m.Keyboard.dbl.ts';
import { until } from './m.Keyboard.until.ts';
import { Match } from './m.Match.ts';
import { Util } from './u.ts';
import { Is } from './m.Is.ts';

const toKeypress = Util.toKeypress as t.KeyboardLib['toKeypress'];

/**
 * Tools for working with a keyboard-input device.
 */
export const Keyboard: t.KeyboardLib = {
  Is,
  Monitor,
  Match,

  onKeydown: KeyListener.keydown,
  onKeyup: KeyListener.keyup,
  on: Monitor.on,
  filter: Monitor.filter,

  toKeypress,
  until,
  dbl,
} as const;

/** Alias to `Keyboard` */
export const Kbd = Keyboard;
