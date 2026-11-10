import { css, type t } from '../common.ts';
import { Button } from '../../ui/Button/mod.ts';

const D = {
  margin: [0, 0, 0, -2],
  padding: [0, 0, 0, 2],
} satisfies Pick<t.Button.Props, 'margin' | 'padding'>;

/** Compact debug-row layout; interaction and focus remain owned by the real Button. */
export const DevButton = (props: t.Dev.Button.Props) => {
  const styles = {
    frame: css({
      lineHeight: 1.2,
      padding: 4,
      margin: '0 -4px',
      // Reserve the additional left overhang without moving the text or right edge.
      paddingLeft: 6,
      marginLeft: -6,
    }),
  };

  return (
    <div className={styles.frame.class}>
      <Button margin={D.margin} padding={D.padding} {...props} />
    </div>
  );
};
