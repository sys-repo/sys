import React from 'react';

import { type t, Color, css, D } from './common.ts';
import { toEllipsis, toFont, toLayout } from './u.ts';
import { Hr } from './ui.Hr.tsx';
import { Row } from './ui.Row.tsx';
import { Spacer } from './ui.Spacer.tsx';
import { Title } from './ui.Title.tsx';

/**
 * Component:
 */
export const KeyValue: React.FC<t.KeyValueProps> = (props) => {
  const { debug = false, items = [], size = D.size, mono = D.mono, truncate = D.truncate } = props;
  const layout = toLayout(props.layout);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const { fontSize, fontFamily } = toFont(props);
  const styles = {
    base: css({
      position: 'relative',
      userSelect: 'none',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontSize,
      fontFamily,
      lineHeight: 1.35,
      display: 'grid',
      rowGap: layout.rowGap,
    }),
  };

  const elRows = items.map((item, i) => {
    type T = t.KeyValueItemProps;
    const key = i;
    const kind = item.kind ?? 'row';
    const args: T = { item, theme: theme.name, mono, truncate, layout, size, debug };

    if (kind === 'row') return <Row key={key} {...args} />;
    if (kind === 'title') return <Title key={key} {...args} />;
    if (kind === 'hr') return <Hr key={key} {...args} />;
    if (kind === 'spacer') return <Spacer key={key} {...args} />;
    return null;
  });

  return <div className={css(styles.base, props.style).class}>{elRows}</div>;
};
