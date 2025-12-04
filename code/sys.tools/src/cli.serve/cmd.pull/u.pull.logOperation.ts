import { type t, Time } from '../common.ts';
import { Config } from '../u.config.ts';

/**
 * Add a log entry for a pull operation.
 */
export function logPullOperation(
  config: t.ServeTool.Config,
  location: t.ServeTool.DirConfig,
  bundle: t.ServeTool.DirRemoteBundle,
  result: t.PullBundleResult,
) {
  const dist = result.dist;
  config.change((d) => {
    const b = Config.findBundle(d, location.dir, bundle.remote.dist, bundle.local.dir);
    if (b) {
      const pulls = b.log.pulls || (b.log.pulls = []);
      pulls.push({
        kind: 'bundle:pull-latest',
        time: Time.now.timestamp,
        pkg: dist.pkg,
        digest: dist.hash.digest,
        size: dist.build.size,
      });
    }
  });
}
