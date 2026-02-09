import React from 'react';
import { CardKindsList } from '../../-dev/ui.Http.DataCards/mod.ts';
import { DataCard } from './-ui.DataCard.tsx';
import { type t, Color, css, Signal } from './common.ts';

export type DataCardsProps = {
  debug: t.DebugSignals;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const DataCards: React.FC<DataCardsProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  if (!v.origin) return null;

  const kind = v.cardKind ?? 'file-content';

  /**
   * Render:
   */
  const theme = Color.theme(v.theme);
  const styles = {
    base: css({
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 15,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <CardKindsList.UI
        theme={theme.name}
        selected={kind}
        kinds={['file-content', 'playback-content']}
        onKindSelect={(e) => (p.cardKind.value = e.id)}
      />
      <DataCard debug={debug} kind={kind} />
    </div>
  );
};
