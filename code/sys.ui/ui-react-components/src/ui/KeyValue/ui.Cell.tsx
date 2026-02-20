import React from 'react';
import { type t, Color, css } from './common.ts';
import { isAnchorElement, resolveHref, toAnchorStyle, toDisplayLabel } from './u.href.ts';
import { toEllipsis, toFont } from './u.ts';
import { Anchor } from './ui.Anchor.tsx';

type Base = Pick<t.KeyValueProps, 'theme' | 'debug' | 'style' | 'mono' | 'truncate' | 'size'>;
export type CellProps = Base & {
  layout: t.KeyValueLayout;
  children: React.ReactNode;
  role: 'key' | 'val';
  href?: t.KeyValueRow['href'];
  opacity?: t.Percent; // Final computed opacity for this cell (including any row-level logic).
  userSelect?: t.CssProps['userSelect'];
};

/**
 * Component:
 */
export const Cell: React.FC<CellProps> = (props) => {
  const { debug = false, role, mono, truncate, size, layout, opacity } = props;
  const isKey = role === 'key';
  const side = isKey ? 'k' : 'v';
  const isSpaced = layout.kind === 'spaced';

  /**
   * Determine if children are plain text.
   * - Ellipsis is only meaningful for simple text/number nodes.
   */
  const isTextChild = typeof props.children === 'string' || typeof props.children === 'number';
  const isAnchorChild = isAnchorElement(props.children);
  const link = !isAnchorChild
    ? resolveHref({ href: props.href, side, children: props.children })
    : undefined;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const { fontSize, fontFamily } = toFont({ size, mono });
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      minWidth: 0,
      fontSize,
      fontFamily,
      opacity: opacity ?? 1,
      userSelect: props.userSelect,
      transition: 'opacity 120ms ease',
      ...(truncate && isTextChild ? toEllipsis(true) : {}), // Ellipsis: only for text children when truncate is enabled.

      // In spaced layout, use an inner grid so
      // JSX <element>'s right-align consistently.
      ...(isSpaced && !isTextChild
        ? {
            display: 'grid',
            width: '100%',
            alignItems: 'center',
            justifyItems: isKey ? 'start' : 'end',
          }
        : {}),
    }),
    asKey: css({ fontFamily: 'sans-serif' }),
    anchor: css(toAnchorStyle({ truncate, textChild: isTextChild, theme })),
  };

  const className = css(styles.base, isKey && styles.asKey, props.style).class;
  const content = (
    <Anchor link={link} style={styles.anchor}>
      {toDisplayLabel(link, props.children)}
    </Anchor>
  );

  return <div className={className}>{content}</div>;
};
