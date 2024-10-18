import { Color, css } from '../common';

export type HrProps = { marginY?: number };
export const Hr: React.FC<HrProps> = (props) => {
  const styles = {
    base: css({
      border: 'none',
      borderTop: `solid 1px ${Color.format(-0.1)}`,
      MarginY: props.marginY ?? 10,
    }),
  };
  return <div {...styles.base} />;
};
