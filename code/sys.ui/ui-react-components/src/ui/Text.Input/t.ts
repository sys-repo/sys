import type { t } from './common.ts';

type Color = string | t.Percent;

/**
 * Text input namespace.
 */
export declare namespace TextInput {
  export type Lib = { readonly UI: t.FC<Props> };

  /**
   * <Component>:
   */
  export type Props = {
    debug?: boolean;

    /** Current input value (controlled pattern). */
    value?: string;
    /** Placeholder text shown when value is empty. */
    placeholder?: string;
    /** Auto-focus the input on mount (pass incrementing number to re-apply focus over time). */
    autoFocus?: boolean | number;
    /** Disable user interaction. */
    disabled?: boolean;
    /** Supress user input (without fully disabling the input). */
    readOnly?: boolean;
    /** Maximum character length allowed. */
    maxLength?: number;
    /** Controls keyboard focus order in the tab sequence. */
    tabIndex?: number;
    /** Element to render before the textbox (left). */
    prefix?: React.JSX.Element | false;
    /** Element to render after the textbox (right). */
    suffix?: React.JSX.Element | false;

    // Flags:
    spellCheck?: boolean;
    autoCapitalize?: boolean;
    autoCorrect?: boolean;
    autoComplete?: boolean;

    /**
     * Appearance:
     */
    padding?: t.CssPaddingInput;
    background?: t.Percent | string;
    border?: Partial<Border> | boolean;
    borderRadius?: t.Pixels;
    theme?: t.CommonTheme;
    style?: t.CssInput;
    inputStyle?: { opacity?: t.Percent; blur?: t.Pixels };

    /**
     * Handlers:
     */
    /** Fires when the textbox is mounted and ready. */
    onReady?: ReadyHandler;
    /** Fires when the textbox value changes. */
    onChange?: ChangeHandler;
    /** Fires on key presses within the textbox. */
    onKeyDown?: KeyHandler;
    onKeyUp?: KeyHandler;

    /** Fires on focus or blur of the text. */
    onFocusChange?: FocusHandler;
    /** Fires when the textbox receives focus. */
    onFocus?: FocusHandler;
    /** Fires when the textbox loses focus. */
    onBlur?: FocusHandler;
    /** Fires when the textbox is pasted into (before the browser mutates the value). */
    onPaste?: PasteHandler;
  };

  /**
   * Border configuration for a textbox input.
   */
  export type Border = {
    mode: 'line:top' | 'line:bottom' | 'outline' | 'none';
    defaultColor: Color;
    focusColor: Color;
  };

  /**
   * Events:
   */
  type BaseArgs<E> = {
    readonly input: HTMLInputElement;
    readonly synthetic: E;
    readonly value: string;
    readonly focused: boolean;
    cancel(): void;
  };

  /** General change events. */
  export type ChangeHandler = (e: ChangeArgs) => void;
  /** Change event payload carrying the current textbox value and synthetic event. */
  export type ChangeArgs = BaseArgs<React.ChangeEvent<HTMLInputElement>>;

  /** Focus events. */
  export type FocusHandler = (e: FocusArgs) => void;
  /** Focus/blur payload carrying value and focus state. */
  export type FocusArgs = BaseArgs<React.FocusEvent<HTMLInputElement>>;

  /** Keyboard events. */
  export type KeyHandler = (e: KeyArgs) => void;
  /** Keyboard payload with key metadata, modifiers, and repeat state. */
  export type KeyArgs = BaseArgs<React.KeyboardEvent<HTMLInputElement>> & {
    readonly input: HTMLInputElement;
    readonly key: string; //  ← HINT: typically use this one over `code`.
    readonly code: string;
    readonly modifiers: t.KeyboardModifierFlags;
    readonly repeat: boolean;
  };

  /** Fires when the textbox is mounted and ready. */
  export type ReadyHandler = (e: ReadyArgs) => void;
  /** Ready payload exposing the mounted input element. */
  export type ReadyArgs = {
    readonly input: HTMLInputElement;
  };

  /** Fires when the textbox is pasted into. */
  export type PasteHandler = (e: PasteArgs) => void;
  /** Paste payload with clipboard text and mutation/cancel controls. */
  export type PasteArgs = {
    /** Plain text from the clipboard. */
    readonly text: string;
    /**
     * Replace the text that will be inserted.
     * Call multiple times to refine; the last call wins.
     */
    modify(replacement: string): void;
    /**
     * Cancel this paste operation completely.
     * Prevents default browser behaviour and stops propagation.
     */
    cancel(): void;
  };
}

// export type TextInputProps = TextInput.Props;
// export type TextInputBorder = TextInput.Border;
// export type TextInputChangeHandler = TextInput.ChangeHandler;
// export type TextInputChangeArgs = TextInput.ChangeArgs;
// export type TextInputFocusHandler = TextInput.FocusHandler;
// export type TextInputFocusArgs = TextInput.FocusArgs;
// export type TextInputKeyHandler = TextInput.KeyHandler;
// export type TextInputKeyArgs = TextInput.KeyArgs;
// export type TextInputReadyHandler = TextInput.ReadyHandler;
// export type TextInputReadyArgs = TextInput.ReadyArgs;
// export type TextInputPasteHandler = TextInput.PasteHandler;
// export type TextInputPasteArgs = TextInput.PasteArgs;
