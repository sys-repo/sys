import React from 'react';
import { type t, Button, Color, css, D, Icons, Is } from './common.ts';

type D = { count?: number; text?: string };

export type FooterToolsProps = {
  doc?: t.CrdtRef;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const FooterTools: React.FC<FooterToolsProps> = (props) => {
  const {} = props;
  const doc = props.doc as t.CrdtRef<D> | undefined;

  /**
   * Handlers:
   */
  const toggleText = () => doc?.change((d) => (d.text = d.text ? '' : '👋'));
  const incrementHandler = (by: number) => {
    return (e: React.MouseEvent) => {
      const next = (current: number) => {
        let delta = 1;

        if (e.metaKey) {
          if (e.shiftKey) delta += 100;
          else return 0;
        } else {
          if (e.shiftKey) delta += 10;
        }

        return current + by * delta;
      };
      doc?.change((d) => {
        if (!Is.number(d.count)) d.count = 0;
        d.count = next(d.count);
      });
    };
  };

  if (!doc) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const hasText = !!doc?.current.text;
  const color = theme.fg;
  const styles = {
    base: css({
      color,
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'auto',
      columnGap: 5,
    }),
    btn: css({ display: 'grid' }),
    strBtn: css({}),
    strBody: css({ fontSize: 16 }),
    strText: css({
      opacity: hasText ? 0.1 : 1,
      transition: 'opacity 120ms ease',
      filter: hasText ? 'grayscale(100%)' : undefined,
    }),
    div: css({
      width: 1,
      borderLeft: `dashed 1px ${Color.alpha(theme.fg, 0.25)}`,
      MarginX: 15,
    }),
  };

  const elStrBtn = (
    <Button theme={theme.name} style={styles.strBtn} onClick={toggleText}>
      <div className={styles.strBody.class}>
        <span>"</span>
        <span className={styles.strText.class}>{'👋'}</span>
        <span>"</span>
      </div>
    </Button>
  );

  const elDiv = <div className={styles.div.class} />;

  return (
    <div className={css(styles.base, props.style).class}>
      {elStrBtn}
      {elDiv}
      <Button theme={theme.name} onClick={incrementHandler(1)}>
        <Icons.Arrow.Up color={color} size={20} />
      </Button>
      <Button theme={theme.name} onClick={incrementHandler(-1)}>
        <Icons.Arrow.Down color={color} size={20} />
      </Button>
    </div>
  );
};
