import { Textbox } from './-ui.textbox.tsx';
import { Color, css, type t } from './common.ts';

type S = t.TextboxSyncState;

/**
 * <Layout>
 */
export type LayoutProps = {
  state?: S | [S, S];
  path?: t.ObjectPath;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};
export const Layout: React.FC<LayoutProps> = (props) => {
  const { theme, path } = props;
  const state = wrangle.state(props.state);

  /**
   * Render
   */
  const color = Color.theme(theme).fg;
  const styles = {
    base: css({ color, display: 'grid', rowGap: '30px', userSelect: 'none' }),
    textbox: css({ width: 260 }),
  };

  const textbox = (debug: string, state?: S, focus?: boolean) => (
    <Textbox debug={debug} focus={focus} state={state} path={path} theme={theme} />
  );

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.textbox}>{textbox('🐷', state[0], true)}</div>
      <div></div>
      <div {...styles.textbox}>{textbox('🌼', state[1])}</div>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  state(state?: S | [S, S]): [S | undefined, S | undefined] {
    if (!state) return [undefined, undefined];
    if (Array.isArray(state)) return state as [S, S];
    return [state, state];
  },
} as const;
