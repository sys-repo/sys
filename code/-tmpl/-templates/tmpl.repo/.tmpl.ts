import type { t } from '../common.ts';
import { main as prep } from './-scripts/task.prep.ts';

/**
 * Setup the template (after copy).
 */
export default async function setup(_dir: t.StringAbsoluteDir) {
  await prep(_dir);
}
