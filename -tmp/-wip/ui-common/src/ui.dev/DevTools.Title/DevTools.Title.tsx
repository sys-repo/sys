import { t, ValueHandler, DEFAULTS } from './common';
import { Title } from './ui.Title';

type O = Record<string, unknown>;

/**
 * A display title.
 */
export function title<S extends O = O>(
  events: t.DevEvents,
  ctx: t.DevCtx,
  initial: S,
  fn: t.DevTitleHandler<S>,
) {
  if (!ctx.is.initial) return;

  const clickHandlers = new Set<t.DevTitleClickHandler<S>>();
  const values = {
    text: ValueHandler<string | [string, string], S>(events),
    style: ValueHandler<t.DevTitleStyle, S>(events),
  };

  const args: t.DevTitleHandlerArgs<S> = {
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
    const onClick = () => clickHandlers.forEach((fn) => fn({ ...args, state, change }));
    return (
      <Title
        text={values.text.current}
        style={values.style.current}
        onClick={clickHandlers.size > 0 ? onClick : undefined}
      />
    );
  });

  Object.values(values).forEach((value) => value.subscribe(ref.redraw));
  fn?.(args);
}
