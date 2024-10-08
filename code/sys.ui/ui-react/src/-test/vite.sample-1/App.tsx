import { useState } from 'react';
import './-tmp-import.ts'; // 🐷

import { Foo } from '@sys/tmp/client/ui';
import { Color, css } from '../../mod.ts';
import type { t } from './common.ts';

/**
 * Sample Component.
 */
export type AppProps = {
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const App: React.FC<AppProps> = (props) => {
  const [isOver, setOver] = useState(false);
  const over = (isOver: boolean) => () => setOver(isOver);

  const theme = Color.theme(props.theme ?? 'Dark');
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
      PaddingY: [15, 30],
    }),
    themeSample: css({
      marginTop: 20,
      display: 'grid',
      placeItems: 'center',
      minHeight: 400,
      color: Color.alpha(theme.fg, isOver ? 1 : 0.3),
      backgroundColor: theme.bg,
      transition: `color 200ms`,
    }),
  };

  const elThemeSample = (
    <div {...styles.themeSample}>
      <div>Hello</div>
    </div>
  );

  return (
    <div {...css(styles.base, props.style)} onMouseEnter={over(true)} onMouseLeave={over(false)}>
      <div {...styles.title}>{`Hello World 👋`}</div>
      <div>
        {'Imported from ← '}
        <Foo />
      </div>
      {elThemeSample}
    </div>
  );
};
