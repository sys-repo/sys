/**
 * @module
 * Slug-oriented runtime loaders and glue.
 */
import type { t } from './common.ts';

import { SlugError as Error } from './m.Error.ts';
import { FromDescriptor } from './m.FromDescriptor.ts';
import { Descriptor } from './m.io.Descriptor.ts';
import { Bundle } from './m.io.Bundle.ts';
import { FileContent } from './m.io.FileContent.ts';
import { Assets } from './m.io.timeline.Assets.ts';
import { Playback } from './m.io.timeline.Playback.ts';
import { Tree } from './m.io.Tree.ts';
import { SlugUrl as Url } from './m.Url.ts';

/** Slug client surface for descriptor and endpoint loaders. */
export const SlugClient: t.SlugClientLib = {
  Url,
  Error,
  FromDescriptor,
  FromEndpoint: {
    Descriptor,
    Tree,
    Assets,
    Bundle,
    Playback,
    FileContent,
  },
};
