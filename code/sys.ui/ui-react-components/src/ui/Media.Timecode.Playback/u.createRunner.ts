import { type t, TimecodeState } from './common.ts';

/**
 * Create a runtime-backed playback runner.
 *
 * This adapter:
 *  - owns reducer state
 *  - feeds inputs into the reducer
 *  - executes reducer-issued commands against the runtime
 *  - exposes a stable observable read-model
 */
export function createRunner(args: t.PlaybackRunnerArgs): t.PlaybackRunner {
  const { runtime, initial } = args;

  let state: t.TimecodeState.Playback.State = initial ?? TimecodeState.Playback.init().state;
  const subs = new Set<(s: t.PlaybackRunnerState) => void>();

  /**
   * Execute reducer-issued commands against the runtime.
   */
  function exec(cmds: readonly t.TimecodeState.Playback.Cmd[]): void {
    for (const cmd of cmds) {
      switch (cmd.kind) {
        case 'cmd:noop':
          break;

        case 'cmd:deck:play':
          runtime.deck.play(cmd.deck);
          break;

        case 'cmd:deck:pause':
          runtime.deck.pause(cmd.deck);
          break;

        case 'cmd:deck:seek':
          runtime.deck.seek?.(cmd.deck, cmd.vTime);
          break;

        case 'cmd:emit-ready':
        case 'cmd:deck:load':
        case 'cmd:swap-decks':
          /**
           * Intentionally no-op here.
           * These are orchestration signals handled
           * by higher adapters or future extensions.
           */
          break;

        default:
          /** Exhaustiveness guard: */
          ((_: never) => _)(cmd);
      }
    }
  }

  /**
   * Publish the current observable read-model.
   */
  function notify(): void {
    const snapshot: t.PlaybackRunnerState = {
      state,
      phase: state.phase,
      intent: state.intent,
      currentBeat: state.currentBeat,
      decks: state.decks,
    };

    subs.forEach((fn) => fn(snapshot));
  }

  /**
   * Apply a reducer update.
   */
  function apply(update: t.TimecodeState.Playback.Update): void {
    state = update.state;
    exec(update.cmds);
    notify();
  }

  return {
    send(input) {
      const update = TimecodeState.Playback.reduce(state, input);
      apply(update);
    },

    get() {
      return {
        state,
        phase: state.phase,
        intent: state.intent,
        currentBeat: state.currentBeat,
        decks: state.decks,
      };
    },

    subscribe(fn) {
      subs.add(fn);
      fn(this.get());
      return () => subs.delete(fn);
    },

    dispose() {
      subs.clear();
    },
  };
}
