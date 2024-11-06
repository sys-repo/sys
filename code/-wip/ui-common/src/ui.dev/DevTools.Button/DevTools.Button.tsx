import { COLORS, Spinner, ValueHandler, type t } from './common';
import { Button } from './ui.Button';

type O = Record<string, unknown>;
type IconInput = JSX.Element | false;
type RightInput = string | false | JSX.Element;
type SpinnerInput = boolean;

/**
 * A simple clickable text button implementation.
 */
export function button<S extends O = O>(
  events: t.DevEvents,
  ctx: t.DevCtx,
  initial: S,
  fn: t.DevButtonHandler<S>,
) {
  if (!ctx.is.initial) return;

  const clickHandlers = new Set<t.DevButtonClickHandler<S>>();
  const values = {
    enabled: ValueHandler<boolean, S>(events),
    icon: ValueHandler<IconInput, S>(events),
    label: ValueHandler<string, S>(events),
    right: ValueHandler<RightInput, S>(events),
    spinner: ValueHandler<SpinnerInput, S>(events),
  };

  const wrangle = {
    rightElement() {
      if (values.spinner.current) return <Spinner.Bar color={COLORS.BLUE} width={35} />;
      const value = values.right.current;
      if (value === false) return undefined;
      return typeof value === 'string' ? <div>{value}</div> : value;
    },
    iconElement() {
      const value = values.icon.current;
      if (value === false) return undefined;
      return typeof value === 'string' ? <div>{value}</div> : value;
    },
  };

  const args: t.DevButtonHandlerArgs<S> = {
    ctx,
    enabled(value) {
      values.enabled.handler(value);
      return args;
    },
    icon(value) {
      values.icon.handler(value);
      return args;
    },
    label(value) {
      values.label.handler(value);
      return args;
    },
    right(value) {
      values.right.handler(value);
      return args;
    },
    spinner(value) {
      values.spinner.handler(value);
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
    const dev = ctx.toObject().props;
    const hasHandlers = clickHandlers.size > 0;
    const isEnabled = hasHandlers && values.enabled.current !== false;
    const onClick = (e: React.MouseEvent) => {
      const is = { meta: e.metaKey, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey };
      clickHandlers.forEach((fn) => fn({ ...args, dev, state, change, is }));
    };

    return (
      <Button
        label={values.label.current}
        iconElement={wrangle.iconElement()}
        rightElement={wrangle.rightElement()}
        enabled={isEnabled}
        onClick={hasHandlers ? onClick : undefined}
      />
    );
  });

  Object.values(values).forEach((value) => value.subscribe(ref.redraw));
  fn?.(args);
}
