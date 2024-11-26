import { DEFAULTS, ValueHandler, type t } from './common';
import { Todo } from './ui.Todo';

type O = Record<string, unknown>;

/**
 * A TODO placeholder.
 */
export function todo<S extends O = O>(
  events: t.DevEvents,
  ctx: t.DevCtx,
  initial: S,
  fn: t.DevTodoHandler<S>,
) {
  if (!ctx.is.initial) return;

  const values = {
    text: ValueHandler<string, S>(events),
    style: ValueHandler<t.DevTodoStyle, S>(events),
  };

  const args: t.DevTodoHandlerArgs<S> = {
    ctx,
    text(value) {
      values.text.handler(value);
      return args;
    },
    style(input) {
      const value = input === null ? DEFAULTS.style : input;
      values.style.handler(value);
      return args;
    },
    redraw(subject) {
      Object.values(values).forEach((value) => value.redraw());
      if (subject) events.redraw.subject();
    },
  };

  const ref = ctx.debug.row(async (e) => {
    return <Todo text={values.text.current} style={values.style.current} />;
  });

  Object.values(values).forEach((value) => value.subscribe(ref.redraw));
  fn?.(args);
}
