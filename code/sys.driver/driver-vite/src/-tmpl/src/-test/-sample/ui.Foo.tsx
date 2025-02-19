import { useState } from 'react';

import { Foo } from '@sys/tmp/ui';
import { Color, css } from '@sys/ui-css';
import type { t } from '../../common.ts';

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

export const FooSample: React.FC<FooComponent> = (props) => {
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
      backgroundColor: Color.RUBY,
      fontSize: 30,
      MarginY: 5,
      PaddingX: 30,
      PaddingY: [30, 15],
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
    <div className={styles.themeSample.class}>
      <div>Hello</div>
    </div>
  );

  return (
    <div
      className={css(styles.base, props.style).class}
      onMouseEnter={over(true)}
      onMouseLeave={over(false)}
    >
      <div className={styles.title.class}>
        <div>{`Hello World 👋`}</div>
      </div>
      <div>{`(see console for import samples)`}</div>
      <div style={{ paddingTop: 10 }}>
        {'Imported from ← '}
        <Foo />
        <div>{'🐷🐷 TMP 🐷🐷 import WIP'}</div>
        <code>{'<JSX> → Vite → ESM.js.d.ts → mod.ts → JSR → import'}</code>
      </div>
      {elThemeSample}
    </div>
  );
};
