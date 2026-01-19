import type { t } from './common.ts';

import { SlugUrl as Url } from './m.Url.ts';
import { loadAssets } from './u.endpoint.loadAssets.ts';
import { loadBundle } from './u.endpoint.loadBundle.ts';
import { loadPlayback } from './u.endpoint.loadPlayback.ts';
import { SlugError as Error } from './m.Error.ts';

export const SlugClient: t.SlugClientLib = {
  Url,
  Error,
  FromEndpoint: {
    loadAssets,
    loadPlayback,
    loadBundle,
  },
};
