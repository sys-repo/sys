import { Url } from '@sys/ui-dom/url';

import type { t } from '../common.ts';
import { makeDevUrlRef as ref } from './u.ref.ts';

/**
 * TODO 🐷 Move ?? where @sys/??? dev-harness.
 * OR make generic "URL" proxy object wrapper - on @sys/std/url
 */

export const DevUrl: t.DevUrlLib = {
  ref,

  forWindow(win, options) {
    const dev = ref(win.location.href);
    Url.bindToWindow(dev.url, options);
    return dev;
  },
};
