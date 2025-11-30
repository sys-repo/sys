import type { t } from './common.ts';
import { makeDevUrlRef as ref } from './m.DevUrl.ref.ts';
import { Url } from '@sys/ui-dom/url';


export const DevUrl: t.DevUrlLib = {
  ref,

  forWindow(win, options) {
    const dev = ref(win.location.href);
    Url.bindToWindow(dev.url, options);
    return dev;
  },
};
