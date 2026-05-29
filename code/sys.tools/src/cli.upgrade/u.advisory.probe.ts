/**
 * @module
 * Background upgrade advisory probe entrypoint.
 */
import { type t } from './common.ts';
import { getVersionInfo } from './u.ts';
import { writeUpgradeAdvisoryFailure, writeUpgradeAdvisorySuccess } from './u.advisory.ts';

export async function runUpgradeAdvisoryProbe(
  deps: {
    readonly getVersionInfo?: typeof getVersionInfo;
    readonly writeSuccess?: typeof writeUpgradeAdvisorySuccess;
    readonly writeFailure?: typeof writeUpgradeAdvisoryFailure;
  } = {},
): Promise<{ readonly ok: true; readonly remote: t.StringSemver } | { readonly ok: false }> {
  const getInfo = deps.getVersionInfo ?? getVersionInfo;
  const writeSuccess = deps.writeSuccess ?? writeUpgradeAdvisorySuccess;
  const writeFailure = deps.writeFailure ?? writeUpgradeAdvisoryFailure;

  try {
    const version = await getInfo();
    try {
      await writeSuccess(version.remote);
    } catch {
      // Advisory persistence must not suppress a successful live probe.
    }
    return { ok: true as const, remote: version.remote };
  } catch (error) {
    try {
      await writeFailure(error);
    } catch {
      // Advisory persistence must remain fail-quiet.
    }
    return { ok: false as const };
  }
}

if (import.meta.main) {
  await runUpgradeAdvisoryProbe();
}
