import React from 'react';
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
export function useStyles() {
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!Is.browser()) {
      setLoaded(true);
      return;
    }

    let count = 0;
    const onLoaded = () => {
      count++;
      if (count >= 2) setLoaded(true);
    };

    import('@vidstack/react/player/styles/base.css').then(onLoaded);
    import('@vidstack/react/player/styles/plyr/theme.css').then(onLoaded);
  }, []);

  // API.
  return { loaded } as const;
}
