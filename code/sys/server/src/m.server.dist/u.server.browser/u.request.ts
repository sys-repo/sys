import type { t } from './common.ts';
import { assetPathname } from './u.asset.ts';

export { acceptsFetchSite } from '../../u.server.request.ts';

/** Admit observed worker destinations independently from ordinary asset routing. */
export function acceptsWorkerDestination(
  request: Request,
  path: t.Files.String.Path | undefined,
  policy: t.DistServer.BrowserPolicy.Input,
  directWorkerAssets: readonly t.Files.String.Path[],
): boolean {
  const value = request.headers.get('sec-fetch-dest');
  if (value === null) return true;
  const destination = value.trim().toLowerCase();

  if (destination === 'worker') {
    return path !== undefined &&
      directWorkerAssets.includes(path) &&
      isExactAssetRequest(request, path);
  }
  if (destination === 'sharedworker') return false;
  if (destination === 'serviceworker') {
    const serviceWorker = policy.serviceWorker;
    return serviceWorker.kind === 'tombstone' &&
      path === serviceWorker.path &&
      isExactAssetRequest(request, path);
  }

  // Malformed worker-like metadata never weakens a recognized worker decision.
  return !destination.includes('worker');
}

function isExactAssetRequest(request: Request, path: t.Files.String.Path): boolean {
  try {
    const url = new URL(request.url);
    return !url.href.includes('?') && url.pathname === assetPathname(path);
  } catch {
    return false;
  }
}
