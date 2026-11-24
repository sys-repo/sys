import { COLORS, css, type t } from '../common.ts';

export type BarSpinnerProps = { style?: t.CssInput };

export const BarSpinner: React.FC<BarSpinnerProps> = (props) => {
  const base = css({ width: 80, height: 4, opacity: 0.5, accentColor: COLORS.DARK });
  return <progress aria-label={'Loading'} className={css(base, props.style).class} />;
};
