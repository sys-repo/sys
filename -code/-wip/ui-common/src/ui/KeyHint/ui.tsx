import { Color, DEFAULTS, css, type t } from './common.ts';
import { Wrangle } from './u.ts';

export const View: React.FC<t.KeyHintProps> = (props) => {
  const { enabled = DEFAULTS.enabled } = props;
  const text = Wrangle.text(props);
  const chars = text.split(' ');

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      fontFamily: 'sans-serif',
      fontSize: 11,
      userSelect: 'none',
      color: theme.fg,
      backgroundColor: theme.alpha(0.06).fg,
      border: `solid 1px ${theme.alpha(0.15).fg}`,
      borderRadius: 4,
      fontStyle: 'normal',
      fontWeight: 600,
      PaddingX: 8,
      height: 22,
      boxSizing: 'border-box',
      opacity: enabled ? 1 : 0.3,

      display: 'grid',
      placeItems: 'center',
      gridTemplateColumns: `repeat(${chars.length}, auto)`,
      columnGap: '4px',
    }),
    windowsMeta: css({
      position: 'relative',
      top: -0.5,
      fontSize: 14, // NB: the "⊞" char renders visibly smaller than "⌘".
    }),
  };

  const elParts = chars.map((char, i) => {
    const style = char === DEFAULTS.modifiers.windows.meta ? styles.windowsMeta : undefined;
    return (
      <span key={`${char}.${i}`} {...style}>
        {char}
      </span>
    );
  });

  return <div {...css(styles.base, props.style)}>{elParts}</div>;
};
