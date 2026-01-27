import React from 'react';
import { type t, Is } from './common.ts';

type LastEvent = {
  readonly controller: t.EffectController<any, any, any>;
  readonly state: any;
};

export const useEffectController: t.UseEffectController = (controller, options) => {
  const id = controller?.id;
  const opts = wrangle.options(options);
  const [, bump] = React.useState(0);

  const lastEventRef = React.useRef<LastEvent | null>(null);
  const didInitRef = React.useRef(false);

  /**
   * Effect: reset init gating when controller identity changes.
   */
  React.useEffect(() => {
    didInitRef.current = false;
    lastEventRef.current = null;
  }, [id]);

  /**
   * Effect: subscribe → re-render.
   */
  React.useEffect(() => {
    if (!controller) return;

    const unsub = controller.onChange((state) => {
      lastEventRef.current = { controller, state };
      bump((n) => n + 1);
    });

    return unsub;
  }, [controller]);

  /**
   * Effect: optional callback (init and/or subsequent changes).
   */
  React.useEffect(() => {
    if (!controller) return;

    const onChange = opts?.onChange;
    if (!onChange) return;

    const fireOnInit = opts?.fireOnInit ?? false;

    if (!didInitRef.current) {
      didInitRef.current = true;
      if (fireOnInit) onChange({ controller, state: controller.current() });
      return;
    }

    const last = lastEventRef.current;
    if (last && last.controller === controller) {
      onChange({ controller, state: last.state });
    } else {
      onChange({ controller, state: controller.current() });
    }
  }, [controller, opts?.onChange, opts?.fireOnInit]);

  return controller?.current();
};

const wrangle = {
  options<State, Patch, Props>(
    input?:
      | t.UseEffectControllerOptions<State, Patch, Props>
      | t.UseEffectControllerChangeHandler<State, Patch, Props>,
  ): t.UseEffectControllerOptions<State, Patch, Props> {
    if (!input) return {};
    if (Is.func(input)) return { onChange: input };
    return input;
  },
} as const;
