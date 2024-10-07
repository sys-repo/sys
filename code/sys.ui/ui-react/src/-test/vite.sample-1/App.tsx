import './-tmp-import.ts'; // 🐷

import { useState } from 'react';

import { Foo } from '@sys/tmp/client/ui';
import { css } from '../../m.Style/mod.ts';
import type { t } from './common.ts';

/**
 * Sample Component.
 */
export type AppProps = {
  style?: t.CssProperties;
};

export const App: React.FC<AppProps> = (props) => {
  const [isOver, setOver] = useState(false);
  const over = (isOver: boolean) => () => setOver(isOver);

  const styles = {
    base: css({
      padding: 10,
      color: 'green',
      backgroundColor: isOver ? 'hotpink' : 'lightgreen',
      fontFamily: 'monospace',
    }),
  };

  return (
    <div {...css(styles.base, props.style)} onMouseEnter={over(true)} onMouseLeave={over(false)}>
      <div>{`Hello World 👋`}</div>
      <Foo />
    </div>
  );
};
