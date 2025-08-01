import React, { useEffect, useRef, useState } from 'react';
import { type t, Icons, Color, css, Signal, D, DEFAULTS, rx, Cropmarks } from '../common.ts';
import type { Section } from '../-schemas/mod.ts';

export type SectionHostProps = {
  data?: Section;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SectionHost: React.FC<SectionHostProps> = (props) => {
  const { data = {} } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
    }),
    body: css({
      minWidth: 380,
    }),
    item: css({
      padding: 15,
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.15)}`,
      ':last-child': { borderBottom: 'none' },

      display: 'grid',
      gridTemplateColumns: '1fr auto',
    }),
  };

  const elBody = (
    <div className={styles.body.class}>
      {Object.entries(data).map(([key, value], i) => {
        return (
          <div key={`${key}.${i}`} className={styles.item.class}>
            <div>{key}</div>
            <Icons.Chevron.Right />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.04}>
        {elBody}
      </Cropmarks>
    </div>
  );
};
