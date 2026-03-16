/**
 * External deploy lane for `driver-deno`.
 *
 * These checks validate real Deno Deploy behavior against an existing app.
 * Keep scenarios here explicit and additive.
 */
import { loadExternalDeployEnv, printExternalDeployEnvGuidance } from './u.env.ts';

if (!loadExternalDeployEnv()) {
  printExternalDeployEnvGuidance();
  Deno.exit(1);
}

await import('./-existing-app.ts');
