import { useState } from 'react';

import { Foo } from '@sys/tmp/ui';
import { Color, css } from '@sys/ui-css';
import type { t } from '../common.ts';

/**
 * Sample Component demonstrating the fundamentals of React
 * and proving module importing works across the monorepo.
 *
 *   - Module "imports" (prove @sys imports from the workspace work)
 *   - Style: CSS primitives
 *   - Style: Color primitives
 *
 */
export type FooComponent = {
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const FooComponent: React.FC<FooComponent> = (props) => {
  const [isOver, setOver] = useState(false);
  const over = (isOver: boolean) => () => setOver(isOver);

  const theme = Color.theme(props.theme ?? 'Dark');
  const styles = {
    base: css({
      Margin: 20,
      padding: 20,
      backgroundColor: isOver ? 'hotpink' : 'lightgreen',
      fontFamily: 'monospace',
      color: 'blue',
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
      minHeight: 300,
      color: Color.alpha(theme.fg, isOver ? 1 : 0.3),
      backgroundColor: theme.bg,
      transition: `color 200ms`,
    }),
  };


  const elThemeSample = (
    <div style={styles.themeSample.style}>
      <div>Hello</div>
    </div>
  );

  return (
    <div
      style={css(styles.base, props.style).style}
      onMouseEnter={over(true)}
      onMouseLeave={over(false)}
    >
      <div style={styles.title.style}>
        <div>{`Hello World 👋`}</div>
        <div>{`(see console for import samples)`}</div>
      </div>
      <div style={{ paddingTop: 10 }}>
        {'Imported from ← '}
        <Foo />
      </div>
      {elThemeSample}
    </div>
  );
};
