import { css, type t } from './common.ts';
import { Wrangle } from './u.ts';
import { useImporter } from './use.Importer.ts';

export type SpinnerPuffProps = {
  size?: number;
  color?: string | number;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

type P = {
  loading?: boolean;
  size?: number;
  color?: string;
  cssOverride?: t.CssValue;
};

export const SpinnerPuff: React.FC<SpinnerPuffProps> = (props) => {
  const { size = 32 } = props;
  const { Spinner } = useImporter<P>(import('react-spinners/PuffLoader'));
  if (!Spinner) return null;

  /**
   * [Render]
   */
  const color = Wrangle.color(props);
  const override: t.CssValue = {};
  const styles = {
    base: css({ position: 'relative' }),
    inner: css({ position: 'relative', top: -5, left: -5 }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.inner}>
        <Spinner color={color} loading={true} size={size} cssOverride={override} />
      </div>
    </div>
  );
};
