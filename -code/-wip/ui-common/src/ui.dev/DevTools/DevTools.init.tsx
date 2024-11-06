import { Lorem } from '../../ui.tools/mod.ts';
import { bdd } from '../DevTools.Bdd/mod.ts';
import { boolean } from '../DevTools.Boolean/mod.ts';
import { button } from '../DevTools.Button/mod.ts';
import { hr } from '../DevTools.Hr/mod.ts';
import { textbox } from '../DevTools.Textbox/mod.ts';
import { title } from '../DevTools.Title/mod.ts';
import { todo } from '../DevTools.Todo/mod.ts';
import { DevBase, Spec, type t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Initializes a DevTools instance with the given
 * context ({ctx}) curried within the closure.
 */
export function init<S extends O = O>(input: t.DevCtxInput, initialState?: S) {
  const initial = initialState ?? ({} as S);
  const ctx = Spec.ctx(input);
  const events = DevBase.Bus.events(input);
  const debug = ctx.debug;

  let _state: t.DevCtxState<S> | undefined;

  const { header, footer, row } = debug;
  const api: t.DevTools<S> = {
    ctx,
    header,
    footer,
    row,

    env<T>() {
      return ctx.env as T;
    },

    redraw(target) {
      return ctx.redraw(target);
    },

    /**
     * Helpers
     */
    section(...args: any[]) {
      if (
        typeof args[0] === 'string' ||
        (Array.isArray(args[0]) && typeof args[0][0] === 'string')
      ) {
        api.title(args[0] as string);
        if (typeof args[1] === 'function') {
          api.section(args[1]);
        } else {
          api.TODO(`"${args[0] ?? 'Unnamed'}" section`);
        }
      }
      if (typeof args[0] === 'function') {
        args[0](api);
      }
      return api;
    },

    async state() {
      return _state || (_state = await ctx.state(initial));
    },

    async change(fn) {
      const state = await api.state();
      return state.change(fn);
    },

    lorem(words, endWith) {
      return Lorem.words(words, endWith);
    },

    /**
     * 🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳
     *
     *  Widget: Argument wrangling methods.
     *
     * 🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳
     */

    /**
     * Title text.
     */
    title(...args: any[]) {
      if (typeof args[0] === 'string' || Array.isArray(args[0])) {
        api.title((title) => title.text(args[0]).style(args[1]));
      }
      if (typeof args[0] === 'function') {
        title<S>(events, ctx, initial, args[0]);
      }
      return api;
    },

    /**
     * Simple button.
     */
    button(...args: any[]) {
      if (Array.isArray(args[0])) {
        api.button((btn) => btn.label(args[0][0]).right(args[0][1]).onClick(args[1]));
      }
      if (typeof args[0] === 'string') {
        api.button((btn) => btn.label(args[0]).onClick(args[1]));
      }
      if (typeof args[0] === 'function') {
        button<S>(events, ctx, initial, args[0]);
      }
      return api;
    },

    /**
     * Boolean switch button.
     */
    boolean(...args: any[]) {
      if (typeof args[0] === 'function') {
        boolean<S>(events, ctx, initial, args[0]);
      }
      return api;
    },

    /**
     * Input Textbox
     */
    textbox(...args: any[]) {
      if (typeof args[0] === 'function') {
        textbox<S>(events, ctx, initial, args[0]);
      }
      return api;
    },

    /**
     * Task marker ("todo")
     */
    TODO(...args: any[]) {
      if (args.length === 0) {
        return api.TODO('');
      }
      if (typeof args[0] === 'string') {
        api.TODO((title) => title.text(args[0]).style(args[1]));
      }
      if (typeof args[0] === 'function') {
        todo<S>(events, ctx, initial, args[0]);
      }
      return api;
    },

    /**
     * Horizontal-rule (visual divider).
     */
    hr(...args: any[]) {
      if (args.length === 0) {
        return api.hr(() => null);
      }
      if (typeof args[0] === 'number' || Array.isArray(args[0])) {
        const line = Array.isArray(args[0]) ? args[0] : [args[0]];
        const margin = args[1];
        const color = args[2];
        return api.hr((hr) => hr.thickness(line[0]).opacity(line[1]).margin(margin).color(color));
      }
      if (typeof args[0] === 'function') {
        hr<S>(events, ctx, initial, args[0]);
      }
      return api;
    },

    /**
     * BDD test-selector/runner.
     */
    bdd(...args: any[]) {
      if (typeof args[0] === 'function') {
        bdd<S>(events, ctx, initial, args[0]);
      }
      return api;
    },
  };

  return api;
}
