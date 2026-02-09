import React from 'react';
import { type t, BulletList, Color, css } from './common.ts';

export type CardKindsListProps = {
  selected?: DataCardKind;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onKindSelect?: t.BulletList.OnSelectHandler<DataCardKind>;
};

const Kinds = ['file-content', 'playback-content'] as const;
export type DataCardKind = (typeof Kinds)[number];

/**
 * Component:
 */
export const UI: React.FC<CardKindsListProps> = (props) => {
  const { debug = false } = props;

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
        items={Kinds.map((id) => ({ id, label: `kind: ${id}` }))}
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
