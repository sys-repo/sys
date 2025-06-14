import { Port } from './m.Port.ts';
import type { NetLib } from './t.ts';

export const Net: NetLib = {
  Port,
  port: Port.get,
};
