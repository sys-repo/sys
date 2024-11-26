import { t, ValueHandler } from '../common';
import { Boolean } from './ui.Boolean';

type O = Record<string, unknown>;

/**
 * A simple clickable text-button that represents a boolean value.
 */
export function boolean<S extends O = O>(
  events: t.DevEvents,
  ctx: t.DevCtx,
  initial: S,
  fn: t.DevBooleanHandler<S>,
) {
  if (!ctx.is.initial) return;

  const clickHandlers = new Set<t.DevBooleanClickHandler<S>>();
  const values = {
    label: ValueHandler<string, S>(events),
    value: ValueHandler<boolean | undefined, S>(events),
    enabled: ValueHandler<boolean, S>(events),
  };

  const args: t.DevBooleanHandlerArgs<S> = {
    ctx,
    label(input) {
      values.label.handler(input);
      return args;
    },
    value(input) {
      values.value.handler(input);
      return args;
    },
    enabled(input) {
      values.enabled.handler(input);
      return args;
    },
    onClick(handler) {
      if (typeof handler === 'function') clickHandlers.add(handler);
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
    const onClick = async () => {
      const current = values.value.current ?? false;
      const dev = ctx.toObject().props;
      clickHandlers.forEach((fn) => fn({ ...args, dev, current, state, change }));
    };

    const hasHandlers = clickHandlers.size > 0;
    const isEnabled = hasHandlers && values.enabled.current !== false;

    return (
      <Boolean
        value={values.value.current}
        label={values.label.current}
        isEnabled={isEnabled}
        onClick={hasHandlers ? onClick : undefined}
      />
    );
  });

  Object.values(values).forEach((value) => value.subscribe(ref.redraw));
  fn?.(args);
}
