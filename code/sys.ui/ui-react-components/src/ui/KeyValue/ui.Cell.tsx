import React from 'react';
import { type t, A, Color, css, D } from './common.ts';
import { isAnchorElement, resolveHref, toAnchorStyle, toDisplayLabel } from './u.href.ts';
import { toEllipsis, toFont } from './u.ts';

type Base = Pick<
  t.KeyValueProps,
  'theme' | 'debug' | 'style' | 'mono' | 'truncate' | 'size' | 'enabled'
>;
export type CellProps = Base & {
  disabledOpacity?: t.Percent;
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
  const isValue = role === 'val';
  const enabled = props.enabled ?? D.enabled;
  const disabledOpacity = props.disabledOpacity ?? D.defaults.disabledOpacity;
  const side = isKey ? 'k' : 'v';
  const isSpaced = layout.kind === 'spaced';

  /**
   * Determine if children are plain text.
   * - Ellipsis is only meaningful for simple text/number nodes.
   */
  const isTextChild = typeof props.children === 'string' || typeof props.children === 'number';
  const isAnchorChild = isAnchorElement(props.children);
  const resolvedHref = !isAnchorChild
    ? resolveHref({ href: props.href, side, children: props.children })
    : undefined;
  const link = resolvedHref;
  const child = !enabled && isAnchorChild ? toDisabledAnchor(props.children) : props.children;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const { fontSize, fontFamily } = toFont({ size, mono });
  const effectiveOpacity = !enabled && isValue ? (opacity ?? 1) * disabledOpacity : (opacity ?? 1);

  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      minWidth: 0,
      fontSize,
      fontFamily,
      opacity: effectiveOpacity,
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
    anchor: css(toAnchorStyle({ truncate, isTextChild })),
  };

  const className = css(styles.base, isKey && styles.asKey, props.style).class;
  const label = toDisplayLabel(resolvedHref, child);
  const content = link ? (
    <A
      href={link.href}
      enabled={enabled}
      disabledOpacity={false}
      target={link.target}
      rel={link.rel}
      style={styles.anchor}
    >
      {label}
    </A>
  ) : (
    label
  );

  return <div className={className}>{content}</div>;
};

function toDisabledAnchor(node: React.ReactNode): React.ReactNode {
  if (!React.isValidElement(node) || node.type !== 'a') return node;
  const anchor = node as React.ReactElement<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
  const props = anchor.props;
  return React.cloneElement(anchor, {
    href: undefined,
    target: undefined,
    rel: undefined,
    tabIndex: -1,
    'aria-disabled': true,
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLAnchorElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    style: props.style,
  });
}
