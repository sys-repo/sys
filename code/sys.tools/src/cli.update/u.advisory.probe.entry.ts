import { runUpdateAdvisoryProbe } from './u.advisory.probe.ts';

if (import.meta.main) {
  try {
    await runUpdateAdvisoryProbe();
  } catch {
    // Advisory probe must remain fail-quiet.
  }
}
