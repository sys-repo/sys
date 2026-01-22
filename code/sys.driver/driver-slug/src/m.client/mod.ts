/**
 * @module
 * Slug-oriented runtime loaders and glue.
 */
export * from './m.Url.ts';

import type { t } from './common.ts';

import { SlugError as Error } from './m.Error.ts';
import { SlugUrl as Url } from './m.Url.ts';
import { Assets } from './m.io.Assets.ts';
import { Bundle } from './m.io.Bundle.ts';
import { Playback } from './m.io.Playback.ts';
import { Tree } from './m.io.Tree.ts';

export const SlugClient: t.SlugClientLib = {
  Url,
  Error,
  FromEndpoint: {
    Tree,
    Assets,
    Bundle,
    Playback,
  },
};
