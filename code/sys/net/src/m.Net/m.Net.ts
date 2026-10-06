import type { t } from './common.ts';

import { Port } from './m.Port.ts';
import { connect } from './u/u.connect.ts';
import { toUrl } from './u/u.toUrl.ts';
import { waitFor } from './u/u.waitFor.ts';

/**
 * Tools for working with a network.
 */
export const Net: t.NetLib = Object.freeze({
  Port,
  port: Port.get,
  connect,
  toUrl,
  waitFor,
});
