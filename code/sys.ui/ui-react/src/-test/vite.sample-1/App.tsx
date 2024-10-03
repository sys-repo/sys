import type { FC } from 'react';
import { Foo } from '@sys/tmp/client/ui';
import { Css } from '../../m.css/mod.ts';

console.log('Css', Css);

import { jsx } from '@emotion/react';

/**
 * Sample Component.
 */
export type AppProps = {};

export const App: FC<AppProps> = (_props = {}) => {
  // const css = jsx({ color: 'hotpink' });
  console.log('jsx', jsx);

  return (
    <div>
      <div>{`Hello World 👋`}</div>
      <Foo />
    </div>
  );
};
