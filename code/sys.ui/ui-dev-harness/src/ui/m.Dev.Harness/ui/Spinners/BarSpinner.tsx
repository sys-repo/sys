import { BarLoader } from 'react-spinners';
import { COLORS, css, type t } from '../common.ts';

export type BarSpinnerProps = {
  style?: t.CssValue;
};

export const BarSpinner: React.FC<BarSpinnerProps> = (props) => {
  const width = 80;
  const styles = {
    base: css({
      position: 'relative',
      width,
      borderRadius: 10,
      overflow: 'hidden',
      opacity: 0.5,
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <BarLoader color={COLORS.DARK} width={width} />
    </div>
  );
};
