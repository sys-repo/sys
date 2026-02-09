import React from 'react';
import { type t, BulletList, Color, css, Arr } from '../common.ts';
import { DataCardKindKinds as Kinds } from '../t.ts';

export type CardKindsListProps = {
  selected?: t.DataCardKind;
  kinds?: t.DataCardKind[];
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onKindSelect?: t.BulletList.OnSelectHandler<t.DataCardKind>;
};

/**
 * Component:
 */
export const UI: React.FC<CardKindsListProps> = (props) => {
  const { debug = false } = props;
  const kinds = Arr.uniq(props.kinds ?? Kinds);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      fontSize: 13,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <BulletList.UI
        theme={theme.name}
        items={kinds.map((id) => ({ id, label: `kind: ${id}` }))}
        selected={props.selected}
        onSelect={props.onKindSelect}
      />
    </div>
  );
};

/**
 * Module
 */
export const CardKindsList = {
  UI,
  Kinds,
};
