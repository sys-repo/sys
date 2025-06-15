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
        if (e.metaKey && e.shiftKey) return 0;
        return current + (e.metaKey ? by * 10 : by);
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
    strBody: css({
      fontSize: 18,
      filter: !!doc?.current.text ? 'grayscale(100%)' : undefined,
      opacity: !!doc?.current.text ? 0.3 : 1,
    }),
    div: css({
      backgroundColor: theme.fg,
      opacity: 0.2,
      width: 1,
      MarginX: 15,
    }),
  };

  const elStrBtn = (
    <Button theme={theme.name} style={styles.strBtn} onClick={toggleText}>
      <div className={styles.strBody.class}>
        <span>"</span>
        <span>{'👋'}</span>
        <span>"</span>
      </div>
    </Button>
  );

  const elDiv = <div className={styles.div.class} />;

  return (
    <div className={css(styles.base, props.style).class}>
      {elStrBtn}
      {elDiv}
      <Button theme={theme.name} onClick={incrementHandler(-1)}>
        <Icons.Arrow.Down color={color} />
      </Button>
      <Button theme={theme.name} onClick={incrementHandler(1)}>
        <Icons.Arrow.Up color={color} />
      </Button>
    </div>
  );
};
