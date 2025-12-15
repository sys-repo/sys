import { type t, TimecodeState } from './common.ts';

/**
 * Create the internal runner loop (no scheduling policy).
 *
 * Responsibilities:
 * - Reduce inputs through the pure playback machine
 * - Publish reducer events (observational only)
 * - Execute reducer-issued commands against the runtime
 * - Notify subscribers with a projected read-model
 *
 * Law (single send() flush):
 *   events → cmds → notify
 *
 * Notes:
 * - No scheduling is implied (raf, timeupdate, interval, etc).
 * - Adapters decide *when* to call `send`.
 * - Events never feed back into the machine.
 */
export function createRunnerLoop(
  deps: t.PlaybackRunnerLoopDeps,
  opts: { readonly initial?: t.TimecodeState.Playback.State } = {},
): t.PlaybackRunnerLoop {
  const { runtime, project, onEvent, onCmd } = deps;

  const subs = new Set<(s: t.PlaybackRunnerState) => void>();
  const machine: t.TimecodeState.Playback.Lib = deps.machine ?? TimecodeState.Playback;
  let state: t.TimecodeState.Playback.State = opts.initial ?? machine.init().state;

  function publish(events: readonly t.TimecodeState.Playback.Event[]): void {
    if (!onEvent) return;
    for (const e of events) onEvent(e);
  }

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

        // Orchestration cmds intentionally ignored at this layer.
        case 'cmd:emit-ready':
        case 'cmd:deck:load':
        case 'cmd:swap-decks':
          break;

        default:
          ((_: never) => _)(cmd);
      }
    }
  }

  function notify(): void {
    const snapshot = project(state);
    subs.forEach((fn) => fn(snapshot));
  }

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
