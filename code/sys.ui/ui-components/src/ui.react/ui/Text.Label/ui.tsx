import { Chip } from '../Chip/mod.ts';
import { Color, css, D, type t } from './common.ts';
import { parseLabel } from './u.parse.ts';

/**
 * Non-interactive inline Markdown, with explicit CSS clipping ownership.
 */
export const TextLabel: t.FC<t.TextLabel.Props> = (props) => {
  const { overflow = D.overflow, debug = D.debug } = props;
  const styles = {
    base: css({ outline: debug ? `dotted 1px ${Color.ruby(0.4)}` : undefined }),
    truncate: {
      display: 'inline-block',
      maxWidth: '100%',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      verticalAlign: 'baseline',
    } as const,
  };

  return (
    <span
      className={css(styles.base, overflow === 'truncate' && styles.truncate, props.style).class}
      data-component={D.displayName}
    >
      {renderInline(parseLabel(props.value), overflow)}
    </span>
  );
};

/**
 * Helpers:
 */
function renderInline(
  nodes: readonly t.LabelInline[],
  overflow: t.TextLabel.Overflow,
): t.ReactNode {
  return nodes.map((node, index) => {
    switch (node.kind) {
      case 'text':
        return node.value;
      case 'code':
        return (
          <Chip.UI
            key={index}
            mono
            truncate={overflow === 'flow'}
            style={overflow === 'flow' ? undefined : { display: 'inline' }}
          >
            <code className={css({ font: 'inherit' }).class}>{node.value}</code>
          </Chip.UI>
        );
      case 'strong':
        return <strong key={index}>{renderInline(node.children, overflow)}</strong>;
      case 'emphasis':
        return <em key={index}>{renderInline(node.children, overflow)}</em>;
    }
  });
}
