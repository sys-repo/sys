import React from 'react';
import { type t, Color, css, Str } from '../common.ts';

export type TitleProps = {
  enabled?: boolean;
  title?: string;
  version?: string;
  dist?: t.DistPkg;
  badge?: t.ImageBadge;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Title: React.FC<TitleProps> = (props) => {
  const { dist } = props;
  const title = props.title?.trim();
  const badge = props.badge;

  if (!(title || badge)) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const color = theme.fg;
  const styles = {
    base: css({
      color,
      display: 'grid',
      gridTemplateColumns: 'min-content minmax(0, 1fr) min-content',
      alignItems: 'center',
      columnGap: 10,
    }),
    left: css({
      fontWeight: 'bold',
      display: 'grid',
      gridAutoFlow: 'column',
      alignItems: 'center',
      columnGap: 3,
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),
    right: css({
      display: 'grid',
      gridAutoFlow: 'column',
      alignItems: 'center',
      columnGap: 10,
      whiteSpace: 'nowrap',
    }),
    block: css({ display: 'block' }),
    version: css({ color: Color.alpha(color, 0.3) }),
    dist: css({ fontWeight: 'normal' }),
    link: css({
      color: Color.BLUE,
      textDecoration: 'none',
      ':hover': { textDecoration: 'underline' },
    }),
  };

  const linkProps = { target: '_blank', rel: 'noopener noreferrer' };
  const elBadge = badge && (
    <a href={badge?.href} {...linkProps}>
      <img className={styles.block.class} src={badge?.image} />
    </a>
  );

  const elDist = dist && (
    <a className={css(styles.dist, styles.link).class} href={'./dist.json'} {...linkProps}>
      {wrangle.dist(dist)}
    </a>
  );

  const elLeft = (
    <div className={styles.left.class}>
      <div>{title}</div>
      {props.version && <span className={styles.version.class}>{`@${props.version}`}</span>}
    </div>
  );

  const elRight = (
    <div className={styles.right.class}>
      {elDist}
      {elBadge}
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elLeft}
      <div />
      {elRight}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  dist(dist: t.DistPkg): string {
    const size = dist.build.size;
    const strSize = `${Str.bytes(size.total)}, /pkg: ${Str.bytes(size.pkg)}`;
    return `dist:version:#${dist.hash.digest.slice(-5)} → ${strSize}`;
  },
} as const;
