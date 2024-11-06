import { Button, Keyboard, css, useMouse, type t } from '../common';
import { Util } from '../u';

export type SpecsResetProps = {
  theme: t.ColorTheme;
  data: t.TestPropListData;
  groups: t.TestSuiteGroup[];
  enabled?: boolean;
  style?: t.CssValue;
};

export const SpecsReset: React.FC<SpecsResetProps> = (props) => {
  const { enabled = true, theme } = props;

  const mouse = useMouse();
  const keyboard = Keyboard.useKeyboardState();
  const isOver = mouse.is.over;
  const isMeta = keyboard.current.modifiers.meta;
  const isClear = Wrangle.isClear(props, isMeta, isOver);
  const label = isClear ? '(none)' : '(all)';

  /**
   * Handlers
   */
  const handleResetClick = (e: React.MouseEvent) => {
    if (!enabled) return;
    const specs = props.data?.specs ?? {};
    const modifiers = Util.modifiers(e);
    const select = isClear ? 'none' : 'all';
    specs.onReset?.({ modifiers, select });
  };

  /**
   * [Render]
   */
  const styles = {
    base: css({
      flex: 1,
      opacity: isOver ? 1 : 0.5,
      transition: 'opacity 0.15s ease-in-out',
      Flex: 'horizontal-center-end',
    }),
    button: css({}),
  };

  return (
    <div {...css(styles.base, props.style)} {...mouse.handlers}>
      <Button onClick={handleResetClick} style={styles.button} enabled={enabled} theme={theme.name}>
        {label}
      </Button>
    </div>
  );
};

/**
 * Helpers
 */
const Wrangle = {
  isClear(props: SpecsResetProps, isMeta: boolean, isOver: boolean) {
    const isInvert = isMeta && isOver;
    const isAllSelected = Util.isAllSelected(props.data, props.groups);
    const isNoneSelected = Util.isNoneSelected(props.data);
    if (isAllSelected) return true;
    if (isNoneSelected) return false;
    return isInvert;
  },
};
