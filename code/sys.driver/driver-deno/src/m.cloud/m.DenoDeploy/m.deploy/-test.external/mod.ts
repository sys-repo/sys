/**
 * External deploy lane for `driver-deno`.
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

const packageDenoJson = await snapshotPackageDenoJson();

try {
  // await import('./-existing-app.ts');
  await import('./-prebuilt-dist.ts');
} finally {
  await restorePackageDenoJsonIfPolluted(packageDenoJson);
}
