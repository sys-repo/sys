import type { t } from './common.ts';

import { Testing as Base } from '@sys/std/testing/server';
import { dir } from './m.Testing.dir.ts';

/**
 * Testing helpers for working on a known server (eg. HTTP/network and file-system).
 */
export const Testing: t.TestingServerLib = { ...Base, dir };
