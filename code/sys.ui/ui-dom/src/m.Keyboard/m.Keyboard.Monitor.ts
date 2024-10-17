import { Match } from './m.Match.ts';
import { DEFAULTS, R, rx, type t } from './common.ts';
import { Util } from './u.ts';

const singleton = {
  isListening: false,
  state: R.clone<t.KeyboardState>(DEFAULTS.state),
};
const { dispose, dispose$ } = rx.disposable();
const singleton$ = new rx.BehaviorSubject<t.KeyboardState>(singleton.state);

/**
 * Global keyboard monitor.
 */
export const KeyboardMonitor: t.KeyboardMonitor = {
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
      document.addEventListener('keydown', keypressHandler);
      document.addEventListener('keyup', keypressHandler);
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
      document.removeEventListener('keydown', keypressHandler);
      document.removeEventListener('keyup', keypressHandler);
      globalThis.removeEventListener('blur', blurHandler);
      reset({ hard: true });
      dispose();
      singleton.isListening = false;
    }
  },

  subscribe(fn: (e: t.KeyboardState) => void) {
    const life = rx.lifecycle();
    if (KeyboardMonitor.is.supported) {
      const $ = KeyboardMonitor.$.pipe(rx.takeUntil(dispose$), rx.takeUntil(life.dispose$));
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

function fireNext(_e?: t.KeyboardKeypress) {
  if (singleton.isListening) singleton$.next(singleton.state);
}

function change(fn: (state: t.KeyboardState) => void) {
  const next = R.clone(singleton.state);
  fn(next);
  singleton.state = next;
}

function reset(options: { hard?: boolean } = {}) {
  const clone = R.clone(DEFAULTS.state);
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
function updateModifierKeys(e: t.KeyboardKeypress) {
  const code = e.keypress.code;

  const update = (
    target: t.KeyboardModifierKeys,
    targetField: keyof t.KeyboardModifierKeys,
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

    values = R.uniq(values);
    target[targetField] = (values.length === 0 ? [] : values) as t.KeyboardModifierEdges;
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

function updatePressedKeys(e: t.KeyboardKeypress) {
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
  options: { dispose$?: t.UntilObservable } = {},
): t.KeyboardMonitorOn {
  const { dispose$ } = options;
  return {
    on(...args: any[]) {
      return handlerOnOverloaded(args, { filter, dispose$ });
    },
  };
}

export function handlerOnOverloaded(
  args: any[],
  options: { filter?: () => boolean; dispose$?: t.UntilObservable } = {},
): t.Lifecycle {
  const { filter } = options;
  const life = rx.lifecycle(options.dispose$);
  const { dispose$ } = life;

  if (typeof args[0] === 'object') {
    const patterns = args[0] as t.KeyMatchPatterns;
    Object.entries(patterns).forEach(([pattern, fn]) => {
      handlerOn(pattern, fn, { dispose$, filter });
    });
    return life;
  }

  if (typeof args[0] === 'string' && typeof args[1] === 'function') {
    return handlerOn(args[0], args[1], { dispose$, filter });
  }

  throw new Error('Input paramters for [Keyboard.on] not matched.');
}

export function handlerOn(
  pattern: t.KeyPattern,
  fn: t.KeyMatchSubscriberHandler,
  options: { dispose$?: t.UntilObservable; filter?: () => boolean } = {},
) {
  const { filter } = options;
  const life = rx.lifecycle(options.dispose$);
  if (!KeyboardMonitor.is.supported) return life;

  ensureStarted();
  const matcher = Match.pattern(pattern);

  singleton$
    .pipe(
      rx.takeUntil(dispose$),
      rx.takeUntil(life.dispose$),
      rx.filter(() => (filter ? filter() : true)),
      rx.filter((e) => !!e.last),
      rx.filter((e) => !e.last?.is.handled),
      rx.filter((e) => e.current.pressed.length > 0),
    )
    .subscribe((e) => {
      const pressed = e.current.pressed.map((e) => e.code);
      const modifiers = e.current.modifiers;

      if (matcher.isMatch(pressed, modifiers)) {
        const event = e.last!;
        fn({
          pattern,
          state: e.current,
          event,
          handled: () => event?.handled(),
        });
      }
    });

  return life;
}
