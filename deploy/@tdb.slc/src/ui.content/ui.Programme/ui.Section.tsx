import React from 'react';
import { type t, Color, css, ObjectView } from './common.ts';

export type SectionProps = {
  media: t.VideoMediaContent;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Section: React.FC<SectionProps> = (props) => {
  const { media } = props;


  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      padding: 10,
      color: theme.fg,
      display: 'grid',
    }),
    body: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <ObjectView name={'media'} data={media} expand={1} />
      </div>
    </div>
  );
};
