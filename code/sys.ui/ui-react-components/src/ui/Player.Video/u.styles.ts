import { Is } from './common.ts';

/**
 * NOTE: Conditionally load styles only when running within browser.
 *       Throws an import error on the server (Deno).
 */
let loadCount = 0;
const loaded = () => loadCount++;

export const Styles = {
  get loaded() {
    return loadCount === 2;
  },
  async import() {
    if (!Is.browser()) return;
    import('@vidstack/react/player/styles/base.css').then(loaded);
    import('@vidstack/react/player/styles/plyr/theme.css').then(loaded);
  },
};
