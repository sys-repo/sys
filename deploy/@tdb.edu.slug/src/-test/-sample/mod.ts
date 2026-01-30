import type { t } from '../../common.ts';

import slug_tree_gHcQi from './slug-tree.21JvXzARPYFXDVMag3x4UhLgHcQi.json' with { type: 'json' };
import slug_assets_9cC7y from './slug.2esGLgD5SoQkeucytmGeadm9cC7y.assets.json' with { type: 'json' };
import slug_playback_9cC7y from './slug.2esGLgD5SoQkeucytmGeadm9cC7y.playback.json' with { type: 'json' };

export const SAMPLES = {
  baseUrl: 'http://localhost:4040/publish.assets',

  SlugTree: {
    'slug-tree.gHcQi:': {
      docid: '21JvXzARPYFXDVMag3x4UhLgHcQi',
      embedded: slug_tree_gHcQi as t.SlugTreeItems,
    },
  },
  Slug: {
    'slug.9cC7y.assets': slug_assets_9cC7y,
    'slug.9cC7y.playback': slug_playback_9cC7y,
  },
} as const;
