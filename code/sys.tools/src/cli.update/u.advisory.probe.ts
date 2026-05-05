import { getVersionInfo } from './u.ts';
import { writeUpdateAdvisoryFailure, writeUpdateAdvisorySuccess } from './u.advisory.ts';

export async function runUpdateAdvisoryProbe(
  deps: {
    readonly getVersionInfo?: typeof getVersionInfo;
    readonly writeSuccess?: typeof writeUpdateAdvisorySuccess;
    readonly writeFailure?: typeof writeUpdateAdvisoryFailure;
  } = {},
) {
  const getInfo = deps.getVersionInfo ?? getVersionInfo;
  const writeSuccess = deps.writeSuccess ?? writeUpdateAdvisorySuccess;
  const writeFailure = deps.writeFailure ?? writeUpdateAdvisoryFailure;

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
