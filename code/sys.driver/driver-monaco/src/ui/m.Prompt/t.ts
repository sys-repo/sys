import type { t } from './common.ts';

/**
 * Constrains Monaco into a prompt-style input
 * (1..n visible lines with controlled enter and overflow behavior).
 *
 * Pure controller logic lives here;
 * React hooks are thin lifecycle adapters only.
 */
export declare namespace EditorPrompt {
  /** Prompt module public API. */
  export type Lib = {
    /** Lifecycle-based Monaco prompt binder. */
    readonly bind: BindPrompt;
  };

  /** Prompt behavior config for MonacoEditor. */
  export type Config = {
    /** Min/max visible line bounds. */
    lines: Lines;
    /** Overflow behavior at max lines. */
    overflow?: Overflow;
    /** Which enter chord triggers submit. */
    submitOn?: SubmitTrigger;
  };

  /** Visible line constraints. */
  export type Lines = {
    /** Minimum visible lines. */
    min: number;
    /** Maximum visible lines. */
    max: number;
  };

  /** Overflow policy once max lines is reached. */
  export type Overflow = 'scroll' | 'clamp';

  /** Enter-key action. */
  export type EnterAction = 'submit' | 'newline';
  /** Submit trigger source. */
  export type SubmitTrigger = 'enter' | 'enter:modified';

  /** Normalized prompt config with defaults applied. */
  export type ConfigResolved = {
    readonly lines: Lines;
    readonly overflow: Overflow;
    readonly submitOn: SubmitTrigger;
  };

  /** Prompt runtime state derived from editor content. */
  export type State = {
    readonly line: StateLine;
    readonly scrolling: boolean;
    readonly height: number;
  };

  /** Line-related prompt state. */
  export type StateLine = {
    readonly count: number;
    readonly visible: number;
    readonly is: StateLineFlags;
  };

  /** Line-related prompt state flags. */
  export type StateLineFlags = {
    readonly max: boolean;
  };

  /** Calculate prompt state from line-count and config. */
  export type CalculateState = (args: {
    config?: Config;
    lineCount: number;
    lineHeight: number;
  }) => State;

  /** Normalize prompt config into deterministic defaults. */
  export type NormalizeConfig = (config?: Config) => ConfigResolved;

  /** Resolve Enter action from policy and modifier state. */
  export type ResolveEnterAction = (args?: {
    config?: Config;
    modifiers?: Partial<t.KeyboardModifierFlags>;
  }) => EnterAction;

  /** Bind prompt behavior to a Monaco editor lifecycle. */
  export type BindPrompt = (args: BindPromptArgs, until?: t.UntilInput) => Promise<Binding>;
  export type BindPromptArgs = {
    editor: t.Monaco.Editor;
    config?: Config;
    lineHeight: number;
    onStateChange?: (state: State) => void;
    onSubmit?: (e: SubmitEvent) => void;
  };

  /** Submit event payload emitted by bind enter handling. */
  export type SubmitEvent = {
    readonly monaco: SubmitEventMonaco;
    readonly state: State;
    readonly trigger: SubmitTrigger;
    readonly text: string;
    readonly modifiers: t.KeyboardModifierFlags;
  };

  /** Monaco handles exposed on submit. */
  export type SubmitEventMonaco = {
    readonly editor: t.Monaco.Editor;
    readonly model: t.Monaco.TextModel;
  };

  /** Live prompt binding instance. */
  export type Binding = t.Lifecycle & {
    readonly config: ConfigResolved;
    readonly model: t.Monaco.TextModel;
    readonly state: State;
    recompute(): State;
  };
}
