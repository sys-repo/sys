import { type t, TimecodeState } from './common.ts';
import { projectRunnerState } from './u.project.runnerState.ts';

/**
 * Create a runtime-backed playback runner.
 *
 * This adapter:
 *  - owns reducer state
 *  - feeds inputs into the reducer
 *  - publishes reducer events (observational)
 *  - executes reducer-issued commands against the runtime
 *  - exposes a stable observable read-model
 *
 * Law (single send flush):
 *   events → cmds → notify
 */
export function createRunner(args: t.PlaybackRunnerArgs): t.PlaybackRunner {
  const { runtime, initial, onEvent, onCmd } = args;
  const machine: t.TimecodeState.Playback.Lib = args.machine ?? TimecodeState.Playback;
  const project: t.PlaybackProjector = projectRunnerState;

  const subs = new Set<(s: t.PlaybackRunnerState) => void>();
  let state: t.TimecodeState.Playback.State = initial ?? machine.init().state;

  /**
   * Execute reducer-issued commands against the runtime.
   */
  function exec(cmds: readonly t.TimecodeState.Playback.Cmd[]): void {
    for (const cmd of cmds) {
      onCmd?.(cmd);

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
   * Publish reducer events (observational only).
   */
  function publish(events: readonly t.TimecodeState.Playback.Event[]): void {
    if (!onEvent) return;
    for (const e of events) onEvent(e);
  }

  /**
   * Publish the current observable read-model.
   */
  function notify(): void {
    const snapshot = project(state);
    subs.forEach((fn) => fn(snapshot));
  }

  /**
   * Apply a reducer update.
   *
   * Law: events → cmds → notify
   */
  function apply(update: t.TimecodeState.Playback.Update): void {
    state = update.state;
    publish(update.events);
    exec(update.cmds);
    notify();
  }

  return {
    send(input) {
      const update = machine.reduce(state, input);
      apply(update);
    },

    get() {
      return project(state);
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
