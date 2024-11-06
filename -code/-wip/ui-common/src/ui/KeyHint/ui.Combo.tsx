import { css, type t, DEFAULTS } from './common.ts';
import { View as Key } from './ui.tsx';

export const Combo: React.FC<t.KeyHintComboProps> = (props) => {
  const { parse, os, theme, enabled = DEFAULTS.enabled } = props;
  const keys = wrangle.keys(props);

  /**
   * Render
   */
  const styles = {
    base: css({
      display: 'grid',
      placeItems: 'center',
      gridTemplateColumns: `repeat(${keys.length}, auto)`,
      columnGap: '3px',
    }),
  };

  const elKeys = keys.map((text, i) => {
    const key = `${text}.${i}`;
    return <Key enabled={enabled} key={key} text={text} os={os} parse={parse} theme={theme} />;
  });

  return <div {...css(styles.base, props.style)}>{elKeys}</div>;
};

/**
 * Helpers
 */
const wrangle = {
  keys(props: t.KeyHintComboProps): string[] {
    if (!props.keys) return [];
    return Array.isArray(props.keys) ? props.keys : [props.keys];
  },
} as const;
