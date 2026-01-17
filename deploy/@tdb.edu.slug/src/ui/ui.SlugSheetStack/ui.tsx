import React from 'react';
import { SlugSheet } from '../ui.SlugSheet/mod.ts';
import { type t, Button, Color, css, D } from './common.ts';

export const SlugSheetStack: React.FC<t.SlugSheetStackProps> = (props) => {
  const { items, onPop, debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      minHeight: 360,
      borderRadius: 8,
      border: `1px solid ${Color.alpha(theme.fg, 0.15)}`,
      backgroundColor: Color.alpha(theme.bg, 0.6),
      overflow: 'hidden',
    }),
    layer: css({
      position: 'absolute',
      inset: 0,
      display: 'grid',
    }),
    topLayer: css({
      boxShadow: `0 20px 40px ${Color.alpha(theme.fg, 0.3)}`,
    }),
    placeholder: css({
      display: 'grid',
      placeItems: 'center',
      minHeight: 200,
      color: Color.alpha(theme.fg, 0.4),
    }),
    backButton: css({
      position: 'absolute',
      top: 8,
      right: 8,
    }),
  };

  if (items.length === 0) {
    return (
      <div className={css(styles.base, props.style).class}>
        <div className={styles.placeholder.class}>No sheets to display</div>
      </div>
    );
  }

  return (
    <div
      data-component={D.displayName}
      className={css(styles.base, props.style).class}
      style={debug ? { outline: `1px dashed ${Color.alpha(theme.fg, 0.5)}` } : undefined}
    >
      {items.map((item, index) => {
        const isTop = index === items.length - 1;
        return (
          <div
            key={item.id}
            className={css(styles.layer, isTop ? styles.topLayer : undefined).class}
            style={{ zIndex: index }}
          >
            <SlugSheet.UI {...item.props} />
            {isTop && onPop ? (
              <div className={styles.backButton.class}>
                <Button label={() => 'Back'} onMouseDown={onPop} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
