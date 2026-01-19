import type { t } from './common.ts';

import { SlugUrl } from './m.Url.ts';
import { loadAssets } from './u.endpoint.loadAssets.ts';
import { loadBundle } from './u.endpoint.loadBundle.ts';
import { loadPlayback } from './u.endpoint.loadPlayback.ts';

export const SlugClient: t.SlugClientLib = {
  Url: SlugUrl,
  FromEndpoint: {
    loadAssets,
    loadPlayback,
    loadBundle,
  },
};
