import React from 'react';
import { type t, Button, Color, css, Style } from '../common.ts';

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
   * Hooks:
   */
  const [boom, setBoom] = React.useState(false);
  if (boom) throw new Error('💥 Derp (render-throw to hit ErrorBoundary)');

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
    body: css({
      display: 'grid',
      gridAutoFlow: 'column',
      gap: 15,
      justifyContent: 'start',
      alignContent: 'start',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div>{props.label ?? `🐷 Foo`}</div>
        <Button label={'throw error 💥'} theme={theme.name} onClick={() => setBoom(true)} />
      </div>
    </div>
  );
};
