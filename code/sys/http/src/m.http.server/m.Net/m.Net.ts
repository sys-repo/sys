import type { NetLib } from './t.ts';

import { Port } from './m.Port.ts';
import { connect } from './u.connect.ts';

export const Net: NetLib = {
  Port,
  port: Port.get,
  connect,
};
