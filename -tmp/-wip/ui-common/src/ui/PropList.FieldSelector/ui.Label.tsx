import { Fragment } from 'react';
import { Color, COLORS, css, type t } from './common.ts';
import { Wrangle } from './u.ts';

export type LabelProps = {
  all: string[];
  selected: string[];
  field: string;
  indexes: boolean;
  indent: number;
  style?: t.CssValue;
  onClick?: React.MouseEventHandler;
};

export const Label: React.FC<LabelProps> = (props) => {
  const { field, all, selected, indexes } = props;
  const isSubField = Wrangle.isSubfield(all, field);
  const index = selected.indexOf(field);

  /**
   * [Render]
   */
  const styles = {
    base: css({ marginLeft: props.indent }),
    subpart: css({ opacity: 0.4 }),
    index: css({
      position: 'relative',
      top: -1,
      marginLeft: 6,
      fontFamily: 'monospace',
      fontWeight: 600,
      fontSize: 9,
      color: Color.alpha(COLORS.DARK, 0.8),
      borderRadius: 3,
      border: `solid 1px ${Color.alpha(COLORS.DARK, 0.1)}`,
      backgroundColor: Color.alpha(COLORS.DARK, 0.1),
      boxSizing: 'border-box',
      PaddingX: 2,
    }),
  };

  const parts = field.split('.');
  const elParts = parts.map((part, i) => {
    const isLast = i === parts.length - 1;
    const style = !isLast && isSubField ? styles.subpart : undefined;
    return (
      <Fragment key={i}>
        <span {...style}>{part}</span>
        {!isLast && <span>{'.'}</span>}
      </Fragment>
    );
  });

  const elIndex = indexes && index > -1 && <span {...styles.index}>{index}</span>;

  return (
    <div {...css(styles.base, props.style)} onMouseDown={props.onClick}>
      {elParts}
      {elIndex}
    </div>
  );
};
