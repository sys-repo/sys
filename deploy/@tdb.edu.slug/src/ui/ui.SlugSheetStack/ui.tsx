import React from 'react';
import { type t, AnimatePresence, Color, css, D } from './common.ts';
import { SlugSheet } from '../ui.SlugSheet/mod.ts';

import { Foo } from '../-test.ui.ts'; // TEMP 🐷

/**
 * Minimal stack manager - pure data structure only
 */
export const SlugSheetStack: React.FC<t.SlugSheetStackProps> = (props) => {
  const { debug = false, items } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      isolation: 'isolate',
    }),
    sheet: css({ Absolute: 0 }),
  };

  const elItems = items.map((item, i) => {
    const main = item.props.slots?.main;
    const top = i * 6;
    const label = `slot:main-${i}`;
    const slots: t.SlugSheetSlots = {
      main: main ?? <Foo theme={theme.name} label={label} style={{ padding: 15 }} />,
    };

    return (
      <div key={item.id} className={styles.sheet.class}>
        <SlugSheet.UI key={item.id} index={i} slots={slots} style={css(styles.sheet, { top })} />
      </div>
    );
  });

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <AnimatePresence>{elItems}</AnimatePresence>
    </div>
  );
};
