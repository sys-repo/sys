import type { SlugClientLib } from './t.ts';

import { SlugUrl } from './m.Url.ts';
import { loadAssetsFromEndpoint } from './u.loadAssetsFromEndpoint.ts';
import { loadBundleFromEndpoint } from './u.loadBundleFromEndpoint.ts';
import { loadPlaybackFromEndpoint } from './u.loadPlaybackFromEndpoint.ts';

export const SlugClient: SlugClientLib = {
  Url: SlugUrl,
  loadAssetsFromEndpoint,
  loadPlaybackFromEndpoint,
  loadBundleFromEndpoint,
};
