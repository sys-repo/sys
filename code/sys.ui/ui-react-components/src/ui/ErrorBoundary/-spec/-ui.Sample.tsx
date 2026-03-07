import React, { useState } from 'react';
import { type t, Button, Color, css } from '../common.ts';

export type SampleProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Sample: React.FC<SampleProps> = (props) => {
  const { debug = false } = props;

  /**
   * Hooks:
   */
  const [boom, setBoom] = useState(false);
  if (boom) throw new Error('💥 Derp (render-throw to hit ErrorBoundary)');

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 20,
      display: 'grid',
      placeItems: 'center',
    }),
    emoji: css({ fontSize: 36 }),
    title: css({
      fontSize: 16,
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'max-content',
      columnGap: 15,
      justifyContent: 'start',
      justifyItems: 'start',
      alignItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>
        <div className={styles.emoji.class}>{`🐷`}</div>
        <Button label={'Click to throw error'} theme={theme.name} onClick={() => setBoom(true)} />
      </div>
    </div>
  );
};
