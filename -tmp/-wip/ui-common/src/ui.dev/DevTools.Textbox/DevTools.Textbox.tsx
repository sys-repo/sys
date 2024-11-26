import { t, ValueHandler } from './common';
import { Textbox } from './ui.Textbox';

type O = Record<string, unknown>;
type BoolOrNil = boolean | undefined | null;
type StringOrNil = string | undefined | null;
type ContentInput = StringOrNil | JSX.Element;
type EdgeInput = ContentInput | boolean;
type MarginOrNil = t.MarginInput | undefined | null;
type ErrorInput = t.DevTextboxError | boolean | undefined | null;
type FocusOrNil = t.DevTextboxFocus | undefined | null;

/**
 * A plain-text Textbox input.
 */
export function textbox<S extends O = O>(
  events: t.DevEvents,
  ctx: t.DevCtx,
  initial: S,
  fn: t.DevTextboxHandler<S>,
) {
  if (!ctx.is.initial) return;

  const changeHandlers = new Set<t.DevTextboxChangeHandler<S>>();
  const enterHandlers = new Set<t.DevTextboxEnterHandler<S>>();
  const values = {
    enabled: ValueHandler<BoolOrNil, S>(events),
    label: ValueHandler<ContentInput, S>(events),
    value: ValueHandler<StringOrNil, S>(events),
    placeholder: ValueHandler<ContentInput, S>(events),
    left: ValueHandler<EdgeInput, S>(events),
    right: ValueHandler<EdgeInput, S>(events),
    footer: ValueHandler<ContentInput, S>(events),
    margin: ValueHandler<MarginOrNil, S>(events),
    focus: ValueHandler<FocusOrNil, S>(events),
    error: ValueHandler<ErrorInput, S>(events),
  };

  const args: t.DevTextboxHandlerArgs<S> = {
    ctx,
    enabled(input) {
      values.enabled.handler(input);
      return args;
    },
    label(input) {
      values.label.handler(input);
      return args;
    },
    value(input) {
      values.value.handler(input);
      return args;
    },
    placeholder(input) {
      values.placeholder.handler(input);
      return args;
    },
    left(input) {
      values.left.handler(input);
      return args;
    },
    right(input) {
      values.right.handler(input);
      return args;
    },
    footer(input) {
      values.footer.handler(input);
      return args;
    },
    margin(input) {
      values.margin.handler(input);
      return args;
    },
    focus(input) {
      values.focus.handler(input);
      return args;
    },
    error(input) {
      values.error.handler(input);
      return args;
    },
    onChange(handler) {
      if (typeof handler === 'function') changeHandlers.add(handler);
      return args;
    },
    onEnter(handler) {
      if (typeof handler === 'function') enterHandlers.add(handler);
      return args;
    },
    redraw(subject) {
      Object.values(values).forEach((value) => value.redraw());
      if (subject) events.redraw.subject();
    },
  };

  const ref = ctx.debug.row(async (e) => {
    const state = await ctx.state<S>(initial);
    const change = state.change;

    const onChange: t.TextInputChangeHandler = (e) => {
      const { selection } = e;
      const to: t.DevTextboxChangeHandlerTo = {
        value: e.to,
        selection,
        get diff() {
          return e.diff;
        },
      };
      const dev = ctx.toObject().props;
      changeHandlers.forEach((fn) => fn({ ...args, dev, to, state, change }));
    };

    const onEnter: t.TextInputKeyHandler = (e) => {
      const dev = ctx.toObject().props;
      enterHandlers.forEach((fn) => fn({ ...args, dev, state, change }));
    };

    const hasHandlers = changeHandlers.size > 0;
    const isEnabled = hasHandlers && values.enabled.current !== false;

    return (
      <Textbox
        isEnabled={isEnabled}
        value={values.value.current}
        label={values.label.current}
        placeholder={values.placeholder.current}
        left={values.left.current}
        right={values.right.current}
        footer={values.footer.current}
        margin={values.margin.current}
        error={values.error.current}
        focusOnReady={values.focus.current?.onReady}
        focusAction={values.focus.current?.action}
        onEnter={onEnter}
        onChange={hasHandlers ? onChange : undefined}
      />
    );
  });

  Object.values(values).forEach((value) => value.subscribe(ref.redraw));
  fn?.(args);
}
