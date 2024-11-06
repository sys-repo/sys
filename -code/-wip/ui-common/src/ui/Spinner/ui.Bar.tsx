import { css, type t } from './common.ts';
import { Wrangle } from './u.ts';
import { useImporter } from './use.Importer.ts';

export type SpinnerBarProps = {
  width?: number;
  color?: string | number;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

type P = {
  loading?: boolean;
  width?: number;
  color?: string;
  cssOverride?: t.CssValue;
};

export const SpinnerBar: React.FC<SpinnerBarProps> = (props) => {
  const { width = 100 } = props;
  const { Spinner } = useImporter<P>(import('react-spinners/BarLoader'));
  if (!Spinner) return null;

  /**
   * [Render]
   */
  const color = Wrangle.color(props);
  const override: t.CssValue = {};
  const styles = {
    base: css({
      position: 'relative',
      width,
      borderRadius: 10,
      overflow: 'hidden',
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <Spinner color={color} loading={true} width={width} cssOverride={override} />
    </div>
  );
};
