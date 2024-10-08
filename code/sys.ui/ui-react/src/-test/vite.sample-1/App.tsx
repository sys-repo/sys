import './-tmp-import.ts'; // 🐷

import { useState } from 'react';

import { Foo } from '@sys/tmp/client/ui';
import { css } from '../../mod.ts';
import type { t } from './common.ts';

/**
 * Sample Component.
 */
export type AppProps = {
  style?: t.CssValue;
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
    title: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      MarginY: 5,
      PaddingX: 10,
      PaddingY: [5, 10],
    }),
  };

  return (
    <div {...css(styles.base, props.style)} onMouseEnter={over(true)} onMouseLeave={over(false)}>
      <div {...styles.title}>{`Hello World 👋`}</div>
      <Foo />
    </div>
  );
};
