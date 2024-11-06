import { type RefObject, useEffect, useState } from 'react';
import { DEFAULTS, Time, css, type t } from './common.ts';
import { Util } from './u.ts';
import { Hint } from './ui.Hint.tsx';
import { Input } from './ui.Input.tsx';

type Props = t.TextInputProps & {
  bus: t.TextInputBus;
  inputRef: RefObject<HTMLInputElement>;
};

/**
 * Component
 */
export const View: React.FC<Props> = (props) => {
  const { bus, inputRef, placeholder, maxLength, theme } = props;
  const {
    isPassword = DEFAULTS.props.isPassword,
    isReadOnly = DEFAULTS.props.isReadOnly,
    isEnabled = DEFAULTS.props.isEnabled,
    disabledOpacity = DEFAULTS.props.disabledOpacity,
    valueStyle = DEFAULTS.theme(theme),
    placeholderStyle,
  } = props;

  const value = Util.Value.format(props.value, maxLength);
  const hasValue = value.length > 0;
  const [width, setWidth] = useState<string | number>();

  /**
   * Lifecycle: Auto-size.
   */
  useEffect(() => {
    const { autoSize } = props;
    if (autoSize) Time.delay(0, async () => setWidth(await Util.Css.toWidth(props))); // NB: Delay is so size measurement returns accurate number.
    if (!autoSize) setWidth(undefined);
  }, [value, props.autoSize]);

  /**
   * [Handlers]
   */
  const handleDoubleClick = (e: React.MouseEvent) => {
    // NB: When the <input> is dbl-clicked and there is no
    //     value it is deduced that the placeholder was clicked.
    if (!hasValue) {
      const handler = Wrangle.labelDoubleClickHandler(props, 'Placeholder');
      handler(e);
    }
  };

  /**
   * [Render]
   */
  const styles = {
    base: {
      position: 'relative',
      boxSizing: 'border-box',
      pointerEvents: isEnabled ? 'auto' : 'none',
      width,
    } as const,
    inner: { position: 'relative' } as const,
    placeholder: {
      Absolute: 0,
      opacity: isEnabled ? 1 : disabledOpacity,
      transition: `opacity 200ms`,

      paddingLeft: 2, // Ensure the placeholder does not bump into the input-caret.
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      userSelect: 'none',
      pointerEvents: 'none',

      transform: placeholderStyle?.offset
        ? `translate(${placeholderStyle.offset[0]}px, ${placeholderStyle.offset[1]}px)`
        : undefined,

      display: 'grid',
      justifyContent: 'left',
      alignContent: 'center',
    } as const,
    readonly: {
      userSelect: 'auto',
      pointerEvents: isEnabled ? 'auto' : 'none',
    } as const,
    input: {
      visibility: isReadOnly ? 'hidden' : 'visible',
      pointerEvents: isReadOnly || !isEnabled ? 'none' : 'auto',
    } as const,
  };

  const elPlaceholder = !hasValue && placeholder && (
    <div
      {...css(styles.placeholder, Util.Css.toPlaceholder(props))}
      onDoubleClick={Wrangle.labelDoubleClickHandler(props, 'Placeholder')}
    >
      {placeholder}
    </div>
  );

  const elReadOnly = isReadOnly && !elPlaceholder && (
    <div
      {...css(valueStyle as t.CssValue, styles.placeholder, styles.readonly)}
      onDoubleClick={Wrangle.labelDoubleClickHandler(props, 'ReadOnly')}
    >
      {value}
    </div>
  );

  const elHint = hasValue && props.hint && (
    <Hint valueStyle={valueStyle} value={value} hint={props.hint} theme={theme} />
  );

  const elInput = (
    <Input
      bus={bus}
      inputRef={inputRef}
      className={props.className}
      theme={theme}
      style={styles.input}
      value={value}
      isEnabled={isEnabled}
      isPassword={isPassword}
      disabledOpacity={disabledOpacity}
      maxLength={props.maxLength}
      valueStyle={valueStyle}
      focusOnReady={props.focusOnReady}
      focusAction={props.focusAction}
      //
      spellCheck={props.spellCheck}
      autoCapitalize={props.autoCapitalize}
      autoCorrect={props.autoCorrect}
      autoComplete={props.autoComplete}
      selectionBackground={props.selectionBackground}
      //
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      onFocusChange={props.onFocusChange}
      onKeyDown={props.onKeyDown}
      onKeyUp={props.onKeyUp}
      onChange={(e) => props.onChange?.(e)}
      onEnter={props.onEnter}
      onEscape={props.onEscape}
      onTab={props.onTab}
      onDoubleClick={handleDoubleClick}
      onSelect={props.onSelect}
    />
  );

  return (
    <div
      {...css(styles.base as t.CssValue, props.style)}
      className={'sys.ui.TextInput'}
      onClick={props.onClick}
      onDoubleClick={props.onDoubleClick}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      {elHint}
      {elPlaceholder}
      {elReadOnly}
      {elInput}
    </div>
  );
};

/**
 * [Helpers]
 */

const Wrangle = {
  labelDoubleClickHandler(props: Props, target: t.TextInputLabelKind) {
    return (e: React.MouseEvent) => {
      const LEFT = 0;
      if (e.button === LEFT) {
        props.onLabelDoubleClick?.({ target });
      }
    };
  },
};
