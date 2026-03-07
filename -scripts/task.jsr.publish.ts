import { pushTriggerTag } from './task.jsr.publish.u.ts';

const TRIGGER_TAG = 'jsr-publish';

/**
 * Refresh the reusable JSR publish trigger tag.
 *
 * IMPORTANT:
 * - This tag is a workflow trigger only.
 * - It is intentionally deleted/recreated on each publish request.
 * - Package versions remain the provenance/release identity.
 */
export async function main() {
  await pushTriggerTag({
    tag: TRIGGER_TAG,
    title: 'JSR Publish Trigger',
  });
}

if (import.meta.main) await main();
