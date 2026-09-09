import React from 'react';
import { Spec, type t } from '../common.ts';
import { ButtonSample } from './ui.Button.tsx';
import { Hr } from './ui.Hr.tsx';

type ButtonClickHandler = (e: ButtonHandlerArgs) => void;
type ButtonHandler = (e: ButtonHandlerArgs) => t.IgnoredResult;
type ButtonHandlerArgs = {
  ctx: t.DevCtx;
  label(value: string): ButtonHandlerArgs;
  onClick(fn: ButtonClickHandler): ButtonHandlerArgs;
};

/**
 * Sample [DevTools].
 *
 * NOTES:
 *    THIS A "THROW_AWAY" SAMPLE IMPLEMENTSTION.
 *
 *    One initial (base/real) implementation can be found is: sys.ui.react.common/dev
 *
 *    ============================================================================
 *
 *    See the [sys.ui.react.common/dev] module for the implementatino of baseline
 *    DebugPanel UI widgets, aka. "DevTools"
 *
 *    These UI tools (such as buttons etc) are seperated out into
 *    the 'common' lib to prevent low-level ciruclar dependencies
 *    where the `sys.ui.dev` module becomes impossible not to bundle
 *    with all other components.
 *
 */
export const DevTools = {
  init(input: t.DevCtxInput) {
    const ctx = Spec.ctx(input);
    const api = {
      ctx,

      /**
       * Widgets.
       */
      button(fn?: ButtonHandler) {
        DevTools.button(input, fn);
        return api;
      },
      hr() {
        DevTools.hr(input);
        return api;
      },
    };
    return api;
  },

  /**
   * A simple clickable text button implementation.
   */
  button(input: t.DevCtxInput, fn?: ButtonHandler) {
    const ctx = Spec.ctx(input);
    if (!ctx.is.initial) return;

    const clickHandlers: ButtonClickHandler[] = [];
    const props = { label: '' };

    const args: ButtonHandlerArgs = {
      ctx,
      label(value) {
        props.label = value;
        ref.redraw();
        return args;
      },
      onClick(handler) {
        clickHandlers.push(handler);
        return args;
      },
    };

    const ref = ctx.debug.row((e) => {
      return (
        <ButtonSample
          ctx={ctx}
          label={props.label}
          onClick={() => clickHandlers.map((fn) => fn(args))}
        />
      );
    });

    fn?.(args);
  },

  /**
   * A horizontal rule (visual divider).
   */
  hr(input: t.DevCtxInput) {
    const ctx = Spec.ctx(input);
    if (ctx.is.initial) ctx.debug.row(<Hr />);
  },
};
