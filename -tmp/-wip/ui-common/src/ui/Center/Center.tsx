import { css, type t } from '../common.ts';

export type CenterProps = {
  flex?: number;
  children?: JSX.Element;
  className?: string;
  style?: t.CssValue;
};

/**
 * Horizontal and verical alignmnet of children.
 */
export const Center: React.FC<CenterProps> = (props) => {
  const { flex } = props;

  const styles = {
    base: css({
      flex,
      position: 'relative',
      display: 'grid',
      justifyContent: 'center',
      alignContent: 'center',
    }),
  };

  return (
    <div {...css(styles.base, props.style)} className={props.className}>
      {props.children}
    </div>
  );
};
