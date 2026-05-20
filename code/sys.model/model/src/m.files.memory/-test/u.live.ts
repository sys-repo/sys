import type { t } from '../../-test.ts';
import { type LiveDriver } from '../u.live/u.driver.ts';
import { createLiveRuntime } from '../u.live/u.runtime.ts';

/** Create a live memory backing with owner-only deterministic source controls. */
export const createLiveForTesting = (
  options: t.FilesMemory.Options = {},
): LiveTestingHarness => {
  const runtime = createLiveRuntime(options);
  return Object.freeze({
    backing: runtime.backing,
    testing: Object.freeze({ mutate: runtime.driver }),
  });
};

type LiveTestingHarness = {
  readonly backing: t.FilesMemory.Live;
  readonly testing: LiveTestingControls;
};

type LiveTestingControls = {
  /** TESTING-ONLY source mutation authority. Not a Files writable capability. */
  readonly mutate: LiveDriver;
};
