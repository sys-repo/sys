import { t, ValueHandler } from '../common';
import { Hr } from './ui.Hr';

type O = Record<string, unknown>;

/**
 * HR: Horizontal-rule (visual divider).
 */
export function hr<S extends O = O>(
  events: t.DevEvents,
  ctx: t.DevCtx,
  initial: S,
  fn: t.DevHrHandler<S>,
) {
  if (!ctx.is.initial) return;

  const values = {
    margin: ValueHandler<t.DevHrMargin, S>(events),
    color: ValueHandler<t.DevHrColor, S>(events),
    thickness: ValueHandler<number, S>(events),
    opacity: ValueHandler<number, S>(events),
  };

  const args: t.DevHrHandlerArgs<S> = {
    ctx,
    margin(value) {
      values.margin.handler(value);
      return args;
    },
    color(value) {
      values.color.handler(value);
      return args;
    },
    thickness(value) {
      values.thickness.handler(value);
      return args;
    },
    opacity(value) {
      values.opacity.handler(value);
      return args;
    },
    redraw(subject) {
      Object.values(values).forEach((value) => value.redraw());
      if (subject) events.redraw.subject();
    },
  };

  const ref = ctx.debug.row((e) => {
    return (
      <Hr
        marginY={values.margin.current}
        color={values.color.current}
        thickness={values.thickness.current}
        opacity={values.opacity.current}
      />
    );
  });

  Object.values(values).forEach((value) => value.subscribe(ref.redraw));
  fn?.(args);
}
