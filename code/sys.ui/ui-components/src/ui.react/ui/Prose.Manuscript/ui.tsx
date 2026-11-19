import type React from 'react';
import { Color, css, D, Str, type t } from './common.ts';
import { useScopedStyles } from './use.Styles.ts';

type P = t.ProseManuscript.Props;

/**
 * Component:
 */
export const Manuscript: React.FC<P> = (props) => {
  const { debug = false } = props;
  const theme = Color.theme(props.theme);
  const scoped = useScopedStyles({ component: D.componentAttr, theme });

  /**
   * Render:
   */
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, scoped, props.style).class} data-component={D.componentAttr}>
      <div>{`🐷 Manuscript`}</div>
      <div>
        <h1>Heading-1</h1>
        <h2>Heading-2</h2>
        {Str.Lorem.words(20)}
        <code>foo.bar</code>
        {Str.Lorem.words(10)}
      </div>
    </div>
  );
};
