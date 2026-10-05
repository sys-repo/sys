type CleanupAction = () => void;

/** Run every cleanup action, then rethrow the first failure. */
export function runCleanup(actions: readonly CleanupAction[]) {
  let failed = false;
  let failure: unknown;

  for (const action of actions) {
    try {
      action();
    } catch (error) {
      if (failed) continue;
      failed = true;
      failure = error;
    }
  }

  if (failed) throw failure;
}
