import { describe, expect, it } from '../../../-test.ts';
import { playerSignalsFactory } from '../../Player.Video.Signals/m.Signals.ts';

import { makeDeterministicSchedule } from './u.fixture.u.deterministicSchedule.ts';

import { type t } from '../common.ts';
// import { TimecodeState } from '...'; // ← machine reduce/init import (ui-state)
// import { PlaybackDriver } from '../mod.ts'; // ← driver create/apply

/**
 * Gate D (closed-loop integration)
 *
 * Deterministic closed-loop unit test proving:
 * 1) input → reduce → cmds → driver.apply → signals → input (no React).
 * 2) Early-ended robustness:
 *    - if physical media ends early, emit video:ended
 *    - machine advances to next logical spec position (pause remainder → next beat → next segment → terminal)
 *    - never stalls in a state where no further progress is possible
 * 3) Pause-window progression:
 *    - when media crosses pauseFrom, driver clamps to pauseFrom and pauses media
 *    - driver owns vTime via monotonic timer from pauseFrom→pauseTo
 *    - at pauseTo, driver resumes video authority (and media play if still intent:'play')
 *
 * Required characteristics:
 * - Uses deterministic schedule fixture (no real time).
 * - Does not import Media.Timecode.Playback/* or Media.Timecode.Timeline/* (Gate A).
 * - Only the Driver reads signals and calls deck effects (Gate B) → proved indirectly by using Driver as the only bridge.
 *
 * Implementation sketch:
 * - Build a minimal Playback.Timeline fixture with:
 *   - at least 1 pause window case
 *   - at least 1 “media ends early but spec continues” case
 * - Create signals decks A/B via playerSignalsFactory()
 * - Create PlaybackDriver with deterministic schedule
 * - Create loop harness:
 *   - state = machine.init().state (or seeded)
 *   - dispatch(input) pushes to queue
 *   - drain queue:
 *     - update = reduce(state, input) → { state, cmds, events }
 *     - driver.apply(update)
 * - Drive the loop by mutating signals:
 *   - endedTick increments → should enqueue video:ended → reduce → cmds (seek/load/swap/etc)
 *   - currentTime updates and deterministic schedule advances for pause timer
 *
 * Acceptance assertions:
 * - Early-ended: after endedTick, state moves forward (beat/segment/phase) and does not freeze.
 * - Pause: emitted vTime sequence is monotonic and ends exactly at pauseTo, then resumes video-driven time.
 */
// 🌸
describe.skip(`Timecode.Driver closed-loop integration (Gate D)`, () => {
  it(`TODO: early-ended robustness closed-loop`, () => {
    expect(true).to.equal(false);
  });

  it(`TODO: pause-window progression closed-loop`, () => {
    expect(true).to.equal(false);
  });
});
