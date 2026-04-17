import React from 'react';
import { type t, BulletList, Color, css, Arr } from '../common.ts';

const Kinds = ['file-content', 'playback-content'] as const satisfies readonly t.HttpDataCards.DataCardKind[];

export type CardKindsListProps = {
  selected?: t.HttpDataCards.DataCardKind;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onKindSelect?: t.BulletList.OnSelectHandler<t.HttpDataCards.DataCardKind>;
};

export const UI: React.FC<CardKindsListProps> = (props) => {
  const theme = Color.theme(props.theme);
  const kinds = Arr.uniq([...Kinds]);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(props.debug ?? false),
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

export const CardKindsList = { UI, Kinds };
