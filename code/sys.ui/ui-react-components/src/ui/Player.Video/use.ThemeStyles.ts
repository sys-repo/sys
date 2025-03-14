import React from 'react';
import { Is } from './common.ts';

export type ThemeKind = 'Plyr';

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
export function useThemeStyles(kind: ThemeKind) {
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!Is.browser()) {
      setLoaded(true);
      return;
    }

    let max = 0;
    let count = 0;
    const onLoaded = () => {
      count++;
      if (count >= max) setLoaded(true);
    };

    if (kind === 'Plyr') {
      max = 2;
      import('@vidstack/react/player/styles/base.css').then(onLoaded);
      import('@vidstack/react/player/styles/plyr/theme.css').then(onLoaded);
      return;
    }

    throw new Error(`Theme "${kind}" not supported.`);
  }, []);

  // API.
  return { loaded } as const;
}
