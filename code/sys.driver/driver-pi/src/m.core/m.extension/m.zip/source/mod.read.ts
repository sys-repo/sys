import type { t } from './common.ts';
import { Obj } from './common.ts';
import { registerZipRead } from './u.read.ts';

declare const __ZIP_READ_POLICY__: t.Policy;
const POLICY = Obj.deepFreeze(__ZIP_READ_POLICY__);

/**
 * Register only bounded read-only ZIP tools under the materialized launch policy.
 */
export default function zipRead(pi: t.Host) {
  registerZipRead(pi, POLICY);
}
