import { withFileMutationQueue } from '@earendil-works/pi-coding-agent';
import { Obj, type t } from './common.ts';
import { registerZipExtract } from './u.extract.ts';

declare const __ZIP_EXTRACT_POLICY__: t.Policy;
const POLICY = Obj.deepFreeze(__ZIP_EXTRACT_POLICY__);

/**
 * Bind cooperative extraction to the queue singleton supplied by the running Pi loader.
 */
export default function zipExtract(pi: t.Host) {
  registerZipExtract(pi, POLICY, withFileMutationQueue);
}
