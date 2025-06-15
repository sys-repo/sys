import React from 'react';
import { type t, Button, Color, css, D, Icons, Is } from './common.ts';

type D = { count: number };

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

  /**
   * Handlers:
   */
  const clickHandler = (by: number) => {
    return () => {
      if (!props.doc) return;
      const doc = props.doc as t.CrdtRef<D>;
      doc.change((d) => {
        if (!Is.number(d.count)) d.count = 0;
        d.count += by;
      });
    };
  };

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
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button theme={theme.name} onClick={clickHandler(1)}>
        <Icons.Arrow.Up color={color} />
      </Button>
      <Button theme={theme.name} onClick={clickHandler(-1)}>
        <Icons.Arrow.Down color={color} />
      </Button>
    </div>
  );
};
