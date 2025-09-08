import type { t } from './common.ts';

import { Port } from './m.Port.ts';
import { connect } from './u.connect.ts';

/**
 * Tools for working with a network.
 */
export const Net: t.NetLib = {
  Port,
  port: Port.get,
  connect,
};
