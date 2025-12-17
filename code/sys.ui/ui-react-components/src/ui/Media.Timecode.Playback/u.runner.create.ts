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

        case 'cmd:deck:load': {
          /**
           * Orchestration cmd: load the media for a beat onto a specific deck.
           *
           * This runner stays mostly signal-agnostic, but if a hosting layer
           * provides `runtime.decks` (VideoPlayerSignals), we can perform a
           * minimal, real load by mutating `props.src`.
           */
          const decks = runtime.decks;
          const timeline = state.timeline;
          const beat = timeline?.beats[cmd.beat];

          const url = beat?.media?.url;
          if (decks && url) {
            const player = decks.get(cmd.deck);
            player.props.src.value = url;
          }
          break;
        }

        case 'cmd:swap-decks': {
          /**
           * Orchestration cmd: indicates the machine has swapped active/standby
           * ownership in state. In a "two stacked videos" UI, the host might
           * need to swap z-index / visibility.
           *
           * This runner intentionally performs no action here. The *meaning*
           * of a visual swap is host-specific (side-by-side debug vs stacked).
           */
          break;
        }

        case 'cmd:emit-ready':
          /**
           * Intentionally no-op here.
           * Ready is an orchestration signal; adapters may translate it into
           * runner-level signals (e.g. `runner:ready`) or bus events.
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
