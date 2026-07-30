import type React from 'react';
import { Chip } from '../../../Chip/mod.ts';
import { Color, css, D, type t } from './common.ts';
import type { NotImplementedReason } from './t.ts';

export type P = {
  children?: t.ReactNode;
  nodeType: string;
  reason: NotImplementedReason;
  style?: t.CssInput;
};

/**
 * Visible fallback for unsupported or structurally invalid Markdown nodes.
 */
export const NotImplemented: React.FC<P> = (props) => {
  const { nodeType, reason } = props;

  /**
   * Render:
   */
  const styles = {
    chip: css({
      boxSizing: 'border-box',
      margin: '0 0.15em',
      maxWidth: 'calc(100% - 0.3em)',
      overflowWrap: 'anywhere',
      whiteSpace: 'normal',
      backgroundColor: Color.alpha(Color.MAGENTA, 0.1),
      borderColor: Color.alpha(Color.MAGENTA, 0.4),
      color: Color.MAGENTA,
      fontWeight: 600,
    }),
  };
  const label = reason === 'invalid' ? `Invalid node: ${nodeType}` : `Not implemented: ${nodeType}`;

  return (
    <>
      <Chip.UI size='xs' mono style={css(styles.chip, props.style)}>
        <span
          data-component={`${D.displayName}.NotImplemented`}
          data-node-type={nodeType}
          data-prose-markdown-fallback={reason}
        >
          {label}
        </span>
      </Chip.UI>
      {props.children}
    </>
  );
};
