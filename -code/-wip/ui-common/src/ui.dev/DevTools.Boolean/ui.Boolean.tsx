import { Button } from '../DevTools.Button/mod.ts';
import { DEFAULTS, FC, Switch, type t } from './common.ts';

export type BooleanProps = {
  isEnabled?: boolean;
  label?: string | JSX.Element;
  value?: boolean;

  style?: t.CssValue;
  labelOpacity?: number;
  onClick?: React.MouseEventHandler;
};

const View: React.FC<BooleanProps> = (props) => {
  const { value = DEFAULTS.value } = props;
  const isActive = Wrangle.isActive(props);

  /**
   * Handlers
   */
  const handleClick: React.MouseEventHandler = (e) => {
    if (isActive) {
      e.preventDefault();
      props.onClick?.(e);
    }
  };

  /**
   * [Render]
   */
  const elRight = (
    <Switch
      value={value}
      enabled={isActive}
      height={16}
      theme={Switch.Theme.light.blue}
      onMouseDown={(e) => e.preventDefault()}
    />
  );

  return (
    <Button
      {...props}
      style={props.style}
      enabled={isActive}
      rightElement={elRight}
      onClick={handleClick}
    />
  );
};

/**
 * [Helpers]
 */

const Wrangle = {
  isActive(props: BooleanProps): boolean {
    const { isEnabled = DEFAULTS.enabled } = props;
    if (!isEnabled) return false;
    if (!props.onClick) return false;
    return true;
  },
};

/**
 * Export
 */
type Fields = {
  DEFAULT: typeof DEFAULTS;
  isActive: typeof Wrangle.isActive;
};
export const Boolean = FC.decorate<BooleanProps, Fields>(
  View,
  { DEFAULT: DEFAULTS, isActive: Wrangle.isActive },
  { displayName: DEFAULTS.displayName },
);
