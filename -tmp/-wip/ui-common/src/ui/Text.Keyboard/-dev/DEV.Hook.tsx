import { Keyboard, ObjectView, css, type t } from './-common.ts';

export type DevHookProps = {
  style?: t.CssValue;
};

export const DevHook: React.FC<DevHookProps> = (props) => {
  const keyboard = Keyboard.useKeyboardState();
  const key = keyboard.current.pressed.map((item) => item.key).join(', ');

  const styles = {
    base: css({}),
    title: css({ marginBottom: 6 }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.title}>{`useKeyboardState`}</div>
      <ObjectView data={{ key, ...keyboard }} expand={1} />
    </div>
  );
};
