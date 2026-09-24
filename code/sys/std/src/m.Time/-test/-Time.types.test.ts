import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Duration, Time, Timecode } from '../../-exports/-time.ts';
import { Timecode as TimecodeOwner } from '../../-exports/-time.timecode.ts';

// Compile-only overload proofs; the runtime parity matrix lives in -Time.until.test.ts.
function overloads(api: t.Time.Lib | t.Time.Until) {
  const ctrl = new AbortController();
  const callback = () => 1;
  for (const options of [ctrl, ctrl.signal, { signal: ctrl.signal }]) {
    expectTypeOf(api.delay(1, callback, options)).toEqualTypeOf<t.Time.Delay.Promise>();
    expectTypeOf(api.delay(1, undefined, options)).toEqualTypeOf<t.Time.Delay.Promise>();
    expectTypeOf(api.delay(callback, options)).toEqualTypeOf<t.Time.Delay.Promise>();
    expectTypeOf(api.delay(undefined, options)).toEqualTypeOf<t.Time.Delay.Promise>();
    expectTypeOf(api.delay(options)).toEqualTypeOf<t.Time.Delay.Promise>();
    expectTypeOf(api.wait(1, options)).toEqualTypeOf<t.Time.Delay.Promise>();
    expectTypeOf(api.wait(undefined, options)).toEqualTypeOf<t.Time.Delay.Promise>();
    expectTypeOf(api.interval(1, callback, options)).toEqualTypeOf<t.Time.Interval.Handle>();
    expectTypeOf(api.interval(1, options, callback)).toEqualTypeOf<t.Time.Interval.Handle>();
  }
  expectTypeOf(api.delay()).toEqualTypeOf<t.Time.Delay.Promise>();
  expectTypeOf(api.delay(1)).toEqualTypeOf<t.Time.Delay.Promise>();
  expectTypeOf(api.delay(callback)).toEqualTypeOf<t.Time.Delay.Promise>();
  expectTypeOf(api.delay(() => Promise.resolve(1))).toEqualTypeOf<t.Time.Delay.Promise>();
  expectTypeOf(api.wait()).toEqualTypeOf<t.Time.Delay.Promise>();
  expectTypeOf(api.interval(1, callback)).toEqualTypeOf<t.Time.Interval.Handle>();

  // @ts-expect-error Timer delays take milliseconds, not duration strings.
  api.delay('1s');
  // @ts-expect-error Milliseconds-first calls reserve the second slot for a callback.
  api.delay(1, ctrl);
  // @ts-expect-error Callback-first calls do not take a third argument.
  api.delay(callback, ctrl, ctrl);
  // @ts-expect-error Options must carry a signal, not a controller in the signal field.
  api.delay({ signal: ctrl });
  // @ts-expect-error Wait does not accept a callback.
  api.wait(1, callback);
  // @ts-expect-error Interval requires a callback.
  api.interval(1);
  // @ts-expect-error Options-first interval requires a callback in the third slot.
  api.interval(1, ctrl);
  // @ts-expect-error Immediate admission is a boolean option.
  api.interval(1, callback, { immediate: 1 });
  // @ts-expect-error Interval does not accept a duration string.
  api.interval('1s', callback);
}
void overloads;

function readonlyLibraries(
  other: t.Time.Lib,
  scope: t.Time.Until,
  timer: t.Time.Timer,
  instant: t.DateTime,
) {
  // @ts-expect-error Removed unused public type.
  const frame: t.Time.FrameOptions = {};
  void frame;

  // @ts-expect-error Frozen library member.
  Time.utc = other.utc;
  // @ts-expect-error Frozen library member.
  Time.duration = other.duration;
  // @ts-expect-error Frozen library member.
  Time.elapsed = other.elapsed;
  // @ts-expect-error Frozen library member.
  Time.timer = other.timer;
  // @ts-expect-error Frozen library member.
  Time.delay = other.delay;
  // @ts-expect-error Frozen library member.
  Time.interval = other.interval;
  // @ts-expect-error Frozen library member.
  Time.wait = other.wait;
  // @ts-expect-error Frozen library member.
  Time.waitFor = other.waitFor;
  // @ts-expect-error Frozen library member.
  Time.until = other.until;
  // @ts-expect-error Frozen library member.
  Time.Delay.create = other.Delay.create;
  // @ts-expect-error Frozen library member.
  Duration.create = other.Duration.create;
  // @ts-expect-error Frozen library member.
  Duration.parse = other.Duration.parse;
  // @ts-expect-error Frozen library member.
  Duration.elapsed = other.Duration.elapsed;
  // @ts-expect-error Frozen library member.
  Duration.format = other.Duration.format;
  // @ts-expect-error Frozen library member.
  Duration.To.sec = other.Duration.To.sec;
  // @ts-expect-error Frozen library member.
  Duration.To.min = other.Duration.To.min;
  // @ts-expect-error Frozen library member.
  Duration.To.hour = other.Duration.To.hour;
  // @ts-expect-error Frozen library member.
  Duration.To.day = other.Duration.To.day;
  // @ts-expect-error Scoped callables retain the root readonly contract.
  scope.delay = other.delay;
  // @ts-expect-error Scoped callables retain the root readonly contract.
  scope.interval = other.interval;
  // @ts-expect-error Scoped callables retain the root readonly contract.
  scope.wait = other.wait;
  // @ts-expect-error The timer owns its reset operation.
  timer.reset = () => timer;
  // @ts-expect-error The instant owns its formatter.
  instant.format = () => '';
}
void readonlyLibraries;

describe('Time public type plane', () => {
  it('retains frozen owners and compatibility aliases', () => {
    expect(Time.Delay.create).to.equal(Time.delay);
    expect(Time.Duration).to.equal(Duration);
    expect(Time.duration).to.equal(Duration.create);
    expect(Time.elapsed).to.equal(Duration.elapsed);
    expect(Timecode).to.equal(TimecodeOwner);
    for (const lib of [Time, Time.Delay, Duration, Duration.To]) {
      expect(Object.isFrozen(lib)).to.eql(true);
    }
    expectTypeOf(Time).toEqualTypeOf<t.Time.Lib>();
    expectTypeOf(Duration).toEqualTypeOf<t.Time.Duration.Lib>();
    expectTypeOf(Time.Delay.create).toEqualTypeOf<t.Time.Delay.Fn>();
  });

  it('input options remain caller-editable', () => {
    const signal = new AbortController().signal;
    const delay: t.Time.Delay.Options = {};
    delay.signal = signal;
    const interval: t.Time.Interval.Options = {};
    interval.signal = signal;
    interval.immediate = true;
    const duration: t.Time.Duration.Options = {};
    duration.round = 3;
    const polling: NonNullable<Parameters<t.Time.Lib['waitFor']>[1]> = {};
    polling.interval = 10;
    polling.timeout = 100;
    polling.signal = signal;
    const distance: t.Date.Format.DistanceOptions = {};
    distance.addSuffix = true;
    expect(polling).to.eql({ interval: 10, timeout: 100, signal });
    expect(distance).to.eql({ addSuffix: true });
    expect(delay).to.eql({ signal });
    expect(interval).to.eql({ signal, immediate: true });
    expect(duration).to.eql({ round: 3 });
  });

  it('waitFor preserves the predicate result type', async () => {
    const result = await Time.waitFor(() => ({ ready: true }));
    expectTypeOf(result).toEqualTypeOf<{ ready: boolean }>();
    expect(result).to.eql({ ready: true });
  });
});
