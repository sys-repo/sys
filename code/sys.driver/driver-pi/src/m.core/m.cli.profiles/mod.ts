/**
 * @module
 * Profile YAML surface for running Pi as a system agent.
 */
import type { t } from './common.ts';
import { main } from './m.main.ts';
import { run } from './m.run.ts';
import { menu } from './u.menu.ts';

/** Profile-driven launcher and menu surface for Pi. */
export const Profiles: t.PiCliProfiles.Lib = { main, run, menu };
