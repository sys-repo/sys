import { pushTriggerTag } from './task.jsr.publish.u.ts';

const TRIGGER_TAG = 'jsr-publish-main';

export async function main() {
  await pushTriggerTag({
    tag: TRIGGER_TAG,
    title: 'JSR Publish Trigger (main)',
    mainOnly: true,
  });
}

if (import.meta.main) await main();

