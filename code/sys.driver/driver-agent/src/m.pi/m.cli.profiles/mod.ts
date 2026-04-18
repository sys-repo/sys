/**
 * @module
 * Persisted profile configs for Pi.
 */
import type { t } from './common.ts';
import { main } from './m.main.ts';
import { run } from './m.run.ts';
import { menu } from './u.menu.ts';

/** Persisted profile launcher and menu surface for Pi. */
export const Profiles: t.PiCliProfiles.Lib = { main, run, menu };
