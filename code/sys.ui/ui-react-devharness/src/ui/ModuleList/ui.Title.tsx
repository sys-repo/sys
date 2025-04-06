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
    base: css({ display: 'grid', gridTemplateColumns: `1fr auto`, color }),
    left: css({ fontWeight: 'bold' }),
    right: css({ display: 'grid', alignContent: 'center' }),
    block: css({ display: 'block' }),

    title: css({ display: 'grid', gridTemplateColumns: `auto 1fr auto` }),
    version: css({ color: Color.alpha(color, 0.3), marginLeft: 3 }),
    hash: css({ marginLeft: 10, fontWeight: 'normal' }),
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
    <a className={css(styles.hash, styles.link).class} href={'./dist.json'} {...linkProps}>
      {`${Str.bytes(dist.size.bytes)} → dist.pkg: #${dist.hash.digest.slice(-5)}`}
    </a>
  );

  const elTitle = title && (
    <div className={styles.title.class}>
      <div>
        <span>{title}</span>
        {props.version && <span className={styles.version.class}>{`@${props.version}`}</span>}
      </div>
      <div />
      <div>{elDist}</div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.left.class}>{elTitle}</div>
      <div className={styles.right.class}>{elBadge}</div>
    </div>
  );
};
