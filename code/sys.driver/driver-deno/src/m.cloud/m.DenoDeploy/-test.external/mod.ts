/**
 * External deploy lane test for `driver-deno`.
 *
 * These checks validate real Deno Deploy behavior against an existing app.
 * Keep scenarios here explicit and additive.
 */
import { loadExternalDeployEnv, printExternalDeployEnvGuidance } from './u.env.ts';
import { restorePackageDenoJsonIfPolluted, snapshotPackageDenoJson } from './u.fixture.ts';

if (!loadExternalDeployEnv()) {
  printExternalDeployEnvGuidance();
  Deno.exit(1);
}

const denoJson = await snapshotPackageDenoJson();

try {
  await import('./-run.pipeline.ts');
} finally {
  await restorePackageDenoJsonIfPolluted(denoJson);
}
