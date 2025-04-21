import React from 'react';
import { type t, Color, css } from './common.ts';
import { BodyHeader } from './ui.Content.Header.tsx';

export type ContentProps = {
  title?: t.ReactNode;
  body?: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onBackClick?: t.MouseEventHandler;
};

/**
 * Component:
 */
export const Content: React.FC<ContentProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    body: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <BodyHeader title={props.title} theme={theme.name} onBackClick={props.onBackClick} />
      <div className={styles.body.class}>{props.body}</div>
    </div>
  );
};
