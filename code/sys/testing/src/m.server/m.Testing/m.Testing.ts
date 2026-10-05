import type * as t from './t.ts';

import { Testing as Base } from '@sys/std/testing/server';
import { connect } from './u/u.connect.ts';
import { dir } from './u/u.dir.ts';
import { withTmpDir } from './u/u.withTmpDir.ts';

/**
 * Testing helpers for working on a known server
 * (eg. HTTP/network and file-system).
 */
export const Testing: t.TestingServerLib = Object.freeze({
  ...Base,
  dir,
  withTmpDir,
  connect,
});
