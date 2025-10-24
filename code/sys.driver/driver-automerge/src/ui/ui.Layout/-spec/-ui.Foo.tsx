import React from 'react';
import { type t, Color, css, Style } from '../common.ts';

export type FooProps = {
  ctx: t.LayoutCtx;
  label?: React.ReactNode;
  style?: t.CssInput;
  padding?: t.CssEdgesInput;
};

/**
 * Component:
 */
export const Foo: React.FC<FooProps> = (props) => {
  const { ctx } = props;

  /**
   * Render:
   */
  const theme = Color.theme(ctx.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(ctx.debug),
      color: theme.fg,
      fontSize: 12,
      display: 'grid',
      ...Style.toPadding(props.padding ?? 10),
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{props.label ?? `🐷 Foo`}</div>
    </div>
  );
};
