import React from 'react';
import { SpecStyles } from './-u.styles.ts';
import { type t, BulletList, Color, css, Fonts, Signal } from './common.ts';

export type FontFamilyProps = {
  debug: t.DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

const FONT_ITEMS = Object.entries(Fonts).map(([id, bundle]) => ({
  id: id as t.Fonts.FontName,
  label: bundle.config.family,
}));

/**
 * Component:
 */
export const FontFamily: React.FC<FontFamilyProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  const selected = v.font ?? 'ETBook';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      gap: 8,
      marginTop: 8,
      color: theme.fg,
    }),
    list: css({ marginLeft: 15 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={SpecStyles.title.class}>Font Family</div>
      <BulletList.UI
        theme={theme.name}
        style={styles.list}
        selected={selected}
        items={FONT_ITEMS}
        onSelect={(e) => (p.font.value = e.id as t.Fonts.FontName)}
      />
    </div>
  );
};
