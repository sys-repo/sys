import { Is } from './common.ts';

/**
 * NOTE: Conditionally load styles only when running within browser.
 *
 * Why?  Prevents throwing an import error on the server (Deno)
 *       which occurs when running unit-tests.
 *
 *  🫵 CONSIDER:
 *       Handling the .css imports within the Vite bundle (?)
 *       which would prevent a FOUC ("Flash Of Unstyled Content")
 *       that does not happen, rather the component just renders
 *       nothing until the `Styles.loaded` is [true].
 */

let loadCount = 0;
const onLoaded = () => loadCount++;

export const Styles = {
  get loaded() {
    return loadCount === 2;
  },
  async import() {
    if (!Is.browser()) return;
    import('@vidstack/react/player/styles/base.css').then(onLoaded);
    import('@vidstack/react/player/styles/plyr/theme.css').then(onLoaded);
  },
};
