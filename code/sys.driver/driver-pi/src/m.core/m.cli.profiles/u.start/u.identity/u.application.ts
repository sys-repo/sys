import type { t } from '../common.ts';

import { refuseIdentity } from './u.source.ts';
import type { AdmittedApplication, ApplicationIdentityExpectation } from './t.ts';

/** Apply Driver Pi's package policy to one Server-owned application session. */
export function admitApplicationPkg(
  started: t.DistServer.Started,
  expected: ApplicationIdentityExpectation,
): AdmittedApplication {
  const observed = started.verification.dist.pkg;
  if (
    !observed || observed.name !== expected.expectedPkg.name ||
    observed.version !== expected.expectedPkg.version
  ) refuseIdentity(expected.diagnostics);

  return Object.freeze({
    origin: started.origin,
    digest: started.verification.dist.hash.digest,
  });
}
