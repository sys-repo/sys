import React from 'react';
import {
  type t,
  Color,
  Cropmarks,
  css,
  Fonts,
  Is,
  toContentData,
  toFileData,
  useFontBundle,
} from './common.ts';

type O = Record<string, unknown>;

export type MainSlotProps = {
  data?: unknown;
  frontmatter?: O;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const MainSlot: React.FC<MainSlotProps> = (props) => {
  const { debug = false, frontmatter } = props;
  const file = toFileData(toContentData(props.data));
  if (!file && !props.frontmatter) return null;

  const title = wrangle.title(frontmatter);

  const bundle = Fonts.ETBook;
  useFontBundle(bundle);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    body: css({
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 10,
      minWidth: 0,
      minHeight: 0,
    }),
    title: css({
      fontFamily: `"${bundle.config.family}"`,
      fontSize: 32,
    }),
  };

  const elBody = (
    <div className={styles.body.class}>
      <div className={styles.title.class}>{title || 'Untitled'}</div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks size={{ mode: 'fill' }} borderOpacity={0.03}>
        {elBody}
      </Cropmarks>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  title(frontmatter?: O) {
    if (!Is.record(frontmatter)) return '';
    if (Is.str(frontmatter.title)) return frontmatter.title;
    return '';
  },
} as const;
