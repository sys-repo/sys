import React from 'react';
import { Color, css, type t } from '../common.ts';

export type TitleProps = {
  enabled?: boolean;
  title?: string;
  version?: string;
  badge?: t.ImageBadge;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Title: React.FC<TitleProps> = (props) => {
  const title = props.title?.trim();
  const badge = props.badge;

  if (!(title || badge)) return null;

  /**
   * Render
   */
  const color = Color.theme(props.theme).fg;
  const styles = {
    base: css({ display: 'grid', gridTemplateColumns: `1fr auto`, color }),
    left: css({ fontWeight: 'bold' }),
    right: css({ display: 'grid', alignContent: 'center' }),
    block: css({ display: 'block' }),
    version: css({ color: Color.alpha(color, 0.3), marginLeft: 3 }),
  };

  const elBadge = badge && (
    <a href={badge?.href} target={'_blank'} rel={'noopener noreferrer'}>
      <img className={styles.block.class} src={badge?.image} />
    </a>
  );

  const elTitle = title && (
    <>
      <span>{title}</span>
      {props.version && <span className={styles.version.class}>{`@${props.version}`}</span>}
    </>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.left.class}>{elTitle}</div>
      <div className={styles.right.class}>{elBadge}</div>
    </div>
  );
};
