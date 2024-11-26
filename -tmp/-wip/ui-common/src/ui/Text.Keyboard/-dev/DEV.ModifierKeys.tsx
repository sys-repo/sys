import { css, type t } from './-common';
import { DevKey, DevKeyDefaults } from './DEV.Key';

type Edge = 'Left' | 'Right';
export type DevModifierKeysProps = {
  edge: Edge;
  state: t.KeyboardState;
  spacing?: number;
  style?: t.CssValue;
};

export const DevModifierKeys: React.FC<DevModifierKeysProps> = (props) => {
  const { edge, state, spacing = DevKeyDefaults.SPACING } = props;
  const isLeft = edge === 'Left';
  const isRight = edge === 'Right';

  type P = { isPressed: boolean; isEdge: boolean; edge: Edge };
  const toPressed = (state: t.KeyboardModifierEdges): P => {
    return {
      isPressed: state.length > 0,
      isEdge: (state as string[]).includes(edge),
      edge,
    };
  };

  const { modifierKeys } = state.current;
  const shift = toPressed(modifierKeys.shift);
  const ctrl = toPressed(modifierKeys.ctrl);
  const alt = toPressed(modifierKeys.alt);
  const meta = toPressed(modifierKeys.meta);

  /**
   * [Render]
   */
  const styles = {
    base: css({ position: 'relative' }),
    top: css({
      marginBottom: spacing,
      display: 'grid',
      gridTemplateColumns: isLeft ? '1.3fr 1fr' : '1fr 1.3fr',
    }),
    bottom: css({
      display: 'grid',
      gridTemplateColumns: 'auto auto auto',
      columnGap: spacing,
    }),
  };

  const elLeft = isLeft && (
    <>
      <DevKey label={'Ctrl'} {...ctrl} />
      <DevKey label={'Alt'} {...alt} />
      <DevKey label={'Meta'} {...meta} />
    </>
  );

  const elRight = isRight && (
    <>
      <DevKey label={'Meta'} {...meta} />
      <DevKey label={'Alt'} {...alt} />
      <DevKey label={'Ctrl'} {...ctrl} />
    </>
  );

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.top}>
        {edge === 'Right' && <div />}
        <DevKey label={'Shift'} {...shift} />
        {edge === 'Left' && <div />}
      </div>
      <div {...styles.bottom}>
        {elLeft}
        {elRight}
      </div>
    </div>
  );
};
