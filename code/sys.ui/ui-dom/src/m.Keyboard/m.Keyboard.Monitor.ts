import { Arr, DEFAULTS, Obj, Rx, type t } from './common.ts';
import { Match } from './m.Match.ts';
import { Util } from './u.ts';

const singleton = {
  isListening: false,
  state: Obj.clone<t.Keyboard.State.Snapshot>(DEFAULTS.state),
};
const { dispose, dispose$ } = Rx.disposable();
const singleton$ = new Rx.BehaviorSubject<t.Keyboard.State.Snapshot>(singleton.state);
const listenerOptions = { capture: true } as const;

/**
 * Global keyboard monitor.
 */
export const KeyboardMonitor: t.Keyboard.Monitor.Lib = {
  is: {
    get supported() {
      return typeof document === 'object';
    },
    get listening() {
      return singleton.isListening;
    },
  },

  get $() {
    ensureStarted();
    return singleton$.asObservable();
  },

  get state() {
    ensureStarted();
    return singleton.state;
  },

  /**
   * Singleton: start listening to the keyboard events.
   * NOTE: Safe to call multiple times, will only ever attach once
   *       to the global keyboard events.
   */
  start() {
    if (!KeyboardMonitor.is.supported) return KeyboardMonitor;
    if (!singleton.isListening) {
      document.addEventListener('keydown', keypressHandler, listenerOptions);
      document.addEventListener('keyup', keypressHandler, listenerOptions);
      globalThis.addEventListener('blur', blurHandler);
      singleton.isListening = true;
    }
    return KeyboardMonitor;
  },

  /**
   * Detach event listeners.
   */
  stop() {
    if (!KeyboardMonitor.is.supported) return;
    if (singleton.isListening) {
      document.removeEventListener('keydown', keypressHandler, listenerOptions);
      document.removeEventListener('keyup', keypressHandler, listenerOptions);
      globalThis.removeEventListener('blur', blurHandler);
      reset({ hard: true });
      dispose();
      singleton.isListening = false;
    }
  },

  subscribe(fn: (e: t.Keyboard.State.Snapshot) => void) {
    const life = Rx.lifecycle();
    if (KeyboardMonitor.is.supported) {
      const $ = KeyboardMonitor.$.pipe(Rx.takeUntil(dispose$), Rx.takeUntil(life.dispose$));
      $.subscribe(fn);
    }
    return life;
  },

  on(...args: any[]) {
    return handlerOnOverloaded(args);
  },

  filter(fn) {
    return handlerFiltered(fn);
  },
};

/**
 * Helpers
 */
function ensureStarted() {
  if (!KeyboardMonitor.is.supported) return;
  if (!singleton.isListening) KeyboardMonitor.start();
}

function blurHandler() {
  reset();
}

function keypressHandler(event: KeyboardEvent) {
  if (!singleton.isListening) return;

  const e = Util.toKeypress(event);
  updateModifierKeys(e);
  updatePressedKeys(e);

  change((state) => (state.last = e));
  fireNext(e);
}

function fireNext(_e?: t.Keyboard.Keypress.Event) {
  if (singleton.isListening) singleton$.next(singleton.state);
}

function change(fn: (state: t.Keyboard.State.Snapshot) => void) {
  const next = Obj.clone(singleton.state);
  fn(next);
  singleton.state = next;
}

function reset(options: { hard?: boolean } = {}) {
  const clone = Obj.clone(DEFAULTS.state);
  if (options.hard) {
    singleton.state = clone; // NB: A hard reset 💥. Drop all existing state.
  } else {
    const last = singleton.state.last;
    singleton.state = { ...clone, last }; // NB: Retain the "last" event history item.
  }
  fireNext();
}

/**
 * State update modifiers.
 */
function updateModifierKeys(e: t.Keyboard.Keypress.Event) {
  const code = e.keypress.code;

  const update = (
    target: t.Keyboard.Modifier.Keys,
    targetField: keyof t.Keyboard.Modifier.Keys,
    match: string,
  ) => {
    if (!(code === `${match}Left` || code === `${match}Right`)) return;

    let values = target[targetField] as string[];
    const isLeft = code.endsWith('Left');
    const isRight = code.endsWith('Right');

    if (e.is.down) {
      if (isLeft) values.push('Left');
      if (isRight) values.push('Right');
    } else {
      if (isLeft) values = values.filter((m) => !m.endsWith('Left'));
      if (isRight) values = values.filter((m) => !m.endsWith('Right'));
    }

    values = Arr.uniq(values);
    target[targetField] = (values.length === 0 ? [] : values) as t.Keyboard.Modifier.Edges;
  };

  change((state) => {
    const modifiers = state.current.modifierKeys;
    update(modifiers, 'shift', 'Shift');
    update(modifiers, 'ctrl', 'Control');
    update(modifiers, 'alt', 'Alt');
    update(modifiers, 'meta', 'Meta');
    state.current.modified = Object.values(modifiers).some((v) => Boolean(v));
    state.current.modifiers = Util.toModifierFlags(modifiers);
  });
}

function updatePressedKeys(e: t.Keyboard.Keypress.Event) {
  const { keypress, is } = e;
  const { code } = keypress;

  if (is.modifier && is.down) return;
  if (is.modifier && is.up) {
    const hasModifiers = Object.values(singleton.state.current.modifiers).some((v) => Boolean(v));
    if (!hasModifiers) {
      // NB: The last modifier-key has been released, clear any down keys.
      //     These pressed keys will not have been reporting their "on keyup" updates while the modifier-keys are in use.
      reset({ hard: true });
    }
    return;
  }

  change((state) => {
    const next = state.current;
    if (is.down) {
      const key = Util.toStateKey(e);
      const index = next.pressed.findIndex((item) => item.code === code);
      if (index < 0) next.pressed.push(key);
      if (index >= 0) next.pressed[index] = key;
    } else {
      next.pressed = next.pressed.filter((k) => k.code !== code);
    }
  });
}

export function handlerFiltered(
  filter: () => boolean,
  options: { until?: t.UntilInput } = {},
): t.Keyboard.Monitor.On {
  const { until } = options;
  return {
    on(...args: any[]) {
      return handlerOnOverloaded(args, { filter, until });
    },
  };
}

export function handlerOnOverloaded(
  args: any[],
  options: { filter?: () => boolean; until?: t.UntilInput } = {},
): t.Lifecycle {
  const { filter } = options;
  const life = Rx.lifecycle(options.until);
  const { dispose$ } = life;

  if (typeof args[0] === 'object') {
    const patterns = args[0] as t.Keyboard.Match.Patterns;
    Object.entries(patterns).forEach(([pattern, fn]) => {
      handlerOn(pattern, fn, { until: dispose$, filter });
    });
    return life;
  }

  if (typeof args[0] === 'string' && typeof args[1] === 'function') {
    return handlerOn(args[0], args[1], { until: dispose$, filter });
  }

  throw new Error('Input parameters for [Keyboard.on] not matched.');
}

function mergeModifiers(
  tracked: t.Keyboard.Modifier.Flags,
  current: t.Keyboard.Modifier.Flags,
): t.Keyboard.Modifier.Flags {
  return {
    shift: tracked.shift || current.shift,
    ctrl: tracked.ctrl || current.ctrl,
    alt: tracked.alt || current.alt,
    meta: tracked.meta || current.meta,
  };
}

export function handlerOn(
  pattern: t.Keyboard.Match.Pattern,
  fn: t.Keyboard.Match.SubscriberHandler,
  options: { until?: t.UntilInput; filter?: () => boolean } = {},
) {
  const { filter } = options;
  const life = Rx.lifecycle(options.until);
  if (!KeyboardMonitor.is.supported) return life;

  ensureStarted();
  const matcher = Match.pattern(pattern);

  singleton$
    .pipe(
      Rx.takeUntil(dispose$),
      Rx.takeUntil(life.dispose$),
      Rx.filter((e) => !!e.last),
      Rx.filter((e) => !Util.isKeyboardPropagationStopped(e.last!)),
      Rx.filter(() => (filter ? filter() : true)),
      Rx.filter((e) => e.current.pressed.length > 0),
    )
    .subscribe((e) => {
      const event = e.last!;
      const pressed = e.current.pressed.map((e) => e.code);
      const modifiers = mergeModifiers(e.current.modifiers, Util.toModifiers(event.keypress));

      if (matcher.isMatch(pressed, modifiers)) {
        fn({
          pattern,
          state: e.current,
          event,
          preventDefault: () => Util.preventDefault(event),
          stopKeyboardPropagation: () => Util.stopKeyboardPropagation(event),
          consume: () => Util.consume(event),
          handled: () => Util.consume(event),
        });
      }
    });

  return life;
}
