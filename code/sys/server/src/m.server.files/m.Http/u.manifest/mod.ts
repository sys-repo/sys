import type { t } from '../../common.ts';
import { manifestPath, matchesPath } from './u.path.ts';
import { manifestResponse } from './u.response.ts';

/** Create a GET JSON projection of the Files manifest command when supported. */
export function manifest(
  options: t.FilesServer.Http.ManifestOptions,
): t.FilesServer.Http.ManifestProjection | undefined {
  if (options.files.capabilities.manifest !== true) return undefined;

  const path = manifestPath(options.path);

  return {
    path,
    label: 'files:manifest',
    matches: (request) => matchesPath(request, path),
    response: (request, signal) => manifestResponse(request, options.files, path, signal),
  };
}
