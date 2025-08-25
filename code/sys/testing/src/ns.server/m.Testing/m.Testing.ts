import type * as t from './t.ts';

import { Testing as Base } from '@sys/std/testing/server';
import { connect } from './u.connect.ts';
import { dir } from './u.dir.ts';

/**
 * Testing helpers for working on a known server
 * (eg. HTTP/network and file-system).
 */
export const Testing: t.TestingServerLib = {
  ...Base,
  dir,
  connect,
};
