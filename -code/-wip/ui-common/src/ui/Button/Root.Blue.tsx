import { COLORS, css, type t } from './common.ts';
import { View } from './ui.Button.tsx';

export const Blue: React.FC<t.ButtonProps> = (props) => {
  /**
   * [Render]
   */
  const styles = {
    blue: css({ color: COLORS.BLUE }),
  };

  return (
    <View style={css(styles.blue, props.style)} {...{ ...props, label: undefined }}>
      {<div {...styles.blue}>{props.label || props.children}</div>}
    </View>
  );
};
