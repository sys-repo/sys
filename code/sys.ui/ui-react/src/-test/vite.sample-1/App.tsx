import './-tmp-import.ts';

import type { t } from './common.ts';
// import { css as emptionCss } from '@emotion/react';
import { Foo } from '@sys/tmp/client/ui';
import { css } from './App.Style.ts';

/**
 * Library: CSS-in-JS helpers.
 */

/**
 * Sample Component.
 */
export type AppProps = {
  style?: t.CssProperties;
};

export const App: React.FC<AppProps> = (props) => {
  const styles = {
    blue: css({ color: 'blue' }),
    base: css({
      padding: 10,
      backgroundColor: 'hotpink',
      ':hover': { color: 'lightgreen' },
    }),
  };

  console.log('styles.base', styles.base);

  return (
    <div
      // {...css(styles.base, props.style)}
      {...styles.base}
    >
      <div>
        <code>{`Hello World 👋`}</code>
      </div>
      <Foo />
    </div>
  );
};
