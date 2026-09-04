/**
 * @module
 * Background upgrade advisory probe entrypoint.
 */
import { type t } from './common.ts';
import { getVersionInfo } from './u.ts';
import { writeUpgradeAdvisoryFailure, writeUpgradeAdvisorySuccess } from './u.advisory.ts';

/** Reads the current local/remote version state. */
type GetVersionInfo = () => Promise<t.UpgradeTool.VersionInfo>;
/** Persists a successful upgrade advisory probe result. */
type WriteSuccess = (version: t.UpgradeTool.VersionInfo) => Promise<void>;
/** Persists a failed upgrade advisory probe result. */
type WriteFailure = (error: unknown) => Promise<void>;

/**
 * Probe the published `@sys/tools` version and persist the advisory result.
 */
export async function runUpgradeAdvisoryProbe(
  deps: {
    readonly getVersionInfo?: GetVersionInfo;
    readonly writeSuccess?: WriteSuccess;
    readonly writeFailure?: WriteFailure;
  } = {},
): Promise<{ readonly ok: true; readonly remote: t.StringSemver } | { readonly ok: false }> {
  const getInfo = deps.getVersionInfo ?? getVersionInfo;
  const writeSuccess = deps.writeSuccess ?? writeUpgradeAdvisorySuccess;
  const writeFailure = deps.writeFailure ?? writeUpgradeAdvisoryFailure;

  try {
    const version = await getInfo();
    try {
      await writeSuccess(version);
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
