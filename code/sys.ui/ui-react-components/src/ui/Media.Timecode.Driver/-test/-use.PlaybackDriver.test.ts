import { describe, expect, it, act, renderHook, DomMock } from '../../../-test.ts';
import { playerSignalsFactory } from '../../Player.Video.Signals/m.Signals.ts';

import { type t } from '../common.ts';
import { usePlaybackDriver } from '../use.PlaybackDriver.ts';
import { makeDeterministicSchedule } from './u.fixture.u.deterministicSchedule.ts';

describe('Media.Timecode.Driver: usePlaybackDriver', () => {
  DomMock.polyfill();

  const ms = (n: number): t.Msecs => n;
  const ix = (n: number): t.TimecodeState.Playback.BeatIndex => n;

  const makeTimeline = (): t.TimecodeState.Playback.Timeline => ({
    beats: [
      {
        index: ix(0),
        vTime: ms(0),
        duration: ms(1000),
        pause: ms(0),
        segmentId: 'seg:1',
        media: { url: 'u:0' },
      },
    ],
    segments: [{ id: 'seg:1', beat: { from: ix(0), to: ix(1) } }],
    virtualDuration: ms(1000),
  });

  const makeMachine = (): t.TimecodeState.Playback.Lib => {
    const init: t.TimecodeState.Playback.Lib['init'] = (args) => {
      const state: t.TimecodeState.Playback.State = {
        phase: 'idle',
        intent: 'stop',
        timeline: args?.timeline,
        currentBeat: args?.startBeat,
        vTime: args?.timeline?.beats[Number(args?.startBeat ?? 0)]?.vTime ?? undefined,
        decks: { active: 'A', standby: 'B', status: { A: 'empty', B: 'empty' } },
        ready: { machine: true },
      };

      const update: t.TimecodeState.Playback.Update = {
        state,
        cmds: [{ kind: 'cmd:emit-ready' }],
        events: [{ kind: 'timecode:ready' }],
      };

      return update;
    };

    const reduce: t.TimecodeState.Playback.Lib['reduce'] = (prev, input) => {
      const cmds: t.TimecodeState.Playback.Cmd[] = [];
      const events: t.TimecodeState.Playback.Event[] = [];

      let state: t.TimecodeState.Playback.State = prev;

      switch (input.kind) {
        case 'playback:init': {
          const start = input.startBeat ?? ix(0);
          const beat0 = input.timeline.beats[Number(start)]!;
          state = {
            ...prev,
            phase: 'active',
            intent: 'pause',
            timeline: input.timeline,
            currentBeat: start,
            vTime: beat0.vTime,
            decks: {
              ...prev.decks,
              active: 'A',
              standby: 'B',
              status: { A: 'ready', B: 'ready' },
            },
            ready: { ...prev.ready, runner: true, deck: { A: true, B: true } },
          };

          cmds.push(
            { kind: 'cmd:deck:load', deck: 'A', beat: start },
            { kind: 'cmd:deck:seek', deck: 'A', vTime: beat0.vTime },
          );

          return { state, cmds, events };
        }

        case 'playback:play': {
          state = { ...prev, intent: 'play' };
          cmds.push({ kind: 'cmd:deck:play', deck: prev.decks.active });
          return { state, cmds, events };
        }

        case 'playback:pause': {
          state = { ...prev, intent: 'pause' };
          cmds.push({ kind: 'cmd:deck:pause', deck: prev.decks.active });
          return { state, cmds, events };
        }

        // We intentionally keep this hook test focused on wiring,
        // not on validating the full machine/driver behavior.
        default: {
          return { state: prev, cmds: [{ kind: 'cmd:noop' }], events: [] };
        }
      }
    };

    return { init, reduce };
  };

  it('wires controller.init → machine.reduce → driver.apply (cmd:deck:load/seek)', () => {
    const machine = makeMachine();

    const A = playerSignalsFactory();
    const B = playerSignalsFactory();

    const { schedule } = makeDeterministicSchedule();
    const timeline = makeTimeline();

    const { result, unmount } = renderHook(() =>
      usePlaybackDriver({
        machine,
        decks: { A, B },
        schedule,
        resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
      }),
    );

    act(() => {
      result.current.controller.init({ timeline, startBeat: ix(0) });
    });

    expect(result.current.state.phase).to.equal('active');
    expect(result.current.state.currentBeat).to.equal(ix(0));
    expect(result.current.state.intent).to.equal('pause');

    // cmd:deck:load should set src.
    expect(A.props.src.value).to.equal('src:0');

    // cmd:deck:seek should set jumpTo to 0 seconds.
    expect(A.props.jumpTo.value?.second).to.equal(0);

    unmount();
  });

  it('wires controller.play → cmd:deck:play (calls deck.play) and updates state.intent', () => {
    const machine = makeMachine();

    const A = playerSignalsFactory();
    const B = playerSignalsFactory();

    let plays = 0;
    const play0 = A.play;
    A.play = () => {
      plays++;
      return play0();
    };

    const { schedule } = makeDeterministicSchedule();
    const timeline = makeTimeline();

    const { result, unmount } = renderHook(() =>
      usePlaybackDriver({
        machine,
        decks: { A, B },
        schedule,
        resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
      }),
    );

    act(() => {
      result.current.controller.init({ timeline, startBeat: ix(0) });
    });

    act(() => {
      result.current.controller.play();
    });

    expect(result.current.state.intent).to.equal('play');
    expect(plays).to.equal(1);

    unmount();
  });

  it('unmount disposes driver (no setState-on-unmounted via deck signals)', async () => {
    const machine = makeMachine();

    const A = playerSignalsFactory();
    const B = playerSignalsFactory();

    const { schedule } = makeDeterministicSchedule();
    const timeline = makeTimeline();

    const err0 = console.error;
    const errors: unknown[] = [];
    console.error = (...args: unknown[]) => {
      errors.push(args);
      err0(...args);
    };

    try {
      const { result, unmount } = renderHook(() =>
        usePlaybackDriver({
          machine,
          decks: { A, B },
          schedule,
          resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
        }),
      );

      act(() => {
        result.current.controller.init({ timeline, startBeat: ix(0) });
      });

      unmount();

      // If the driver did NOT dispose, these signal mutations would still dispatch inputs
      // into a now-unmounted hook, typically producing React warnings/errors.
      A.props.currentTime.value = 0.25 as t.Secs;
      A.props.endedTick.value = A.props.endedTick.value + 1;

      // Let any microtasks flush.
      await Promise.resolve();

      // We don’t assert the exact message text (React varies), only that nothing was reported.
      expect(errors.length).to.equal(0);
    } finally {
      console.error = err0;
    }
  });
});
