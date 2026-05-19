# PLAN — @sys/std Time namespace alias removal

## Status

- Complete.
- Implementation commit: `ad58f8fa4 refactor(std)!: remove flat Time type aliases`.
- `Time` is now the canonical owning namespace for the std time type surface.
- Current canonical shape is `t.Time.*`.
- Flat compatibility aliases have been removed from live source.

## Final target shape

Use namespaced type references:

- `t.Time.Lib`
- `t.Time.FrameOptions`
- `t.Time.Until`
- `t.Time.Timer`
- `t.Time.Delay.Fn`
- `t.Time.Delay.Promise`
- `t.Time.Delay.Handle`
- `t.Time.Delay.Options`
- `t.Time.Delay.Callback`
- `t.Time.Interval.Fn`
- `t.Time.Interval.Handle`
- `t.Time.Interval.Options`
- `t.Time.Interval.Callback`
- `t.Time.Duration.Lib`
- `t.Time.Duration.Input`
- `t.Time.Duration.Options`
- `t.Time.Duration.To`
- `t.Time.Duration.Instance`

## Removed flat aliases

Removed from live source:

- `TimeLib`
- `TimeFrameOptions`
- `TimeUntil`
- `Timer` flat export from `m.Time/t.Time.ts`
- `TimeDelayFn`
- `TimeDelayPromise`
- `TimeDelay`
- `TimeDelayOptions`
- `TimeDelayCallback`
- `TimeIntervalFn`
- `TimeInterval`
- `TimeIntervalOptions`
- `TimeIntervalCallback`
- `TimeInput`
- `TimeDurationLib`
- `TimeDurationOptions`
- `TimeDurationTo`

Deleted former flat-alias type files:

- `code/sys/std/src/m.Time/t.Time.Delay.ts`
- `code/sys/std/src/m.Time/t.Time.Interval.ts`
- `code/sys/std/src/m.Time/t.Time.Duration.ts`

## Migration completed

Std local implementation/tests now use `t.Time.*` directly.

External consumers migrated:

- `code/sys.driver/driver-vite/src/common/t.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test/-dev.test.ts`
- `code/sys.driver/driver-automerge/src/common/t.ts`
- `code/sys.driver/driver-automerge/src/ui/use/use.Doc.ts`
- `code/sys/process/src/common/t.ts`
- `code/sys/process/src/m.process/u.kill.ts`
- `code/sys/http/src/http.cmd/u.ts`
- `code/sys/testing/src/common/t.ts`
- `code/sys/testing/src/ns.client/m.Spec/TestSuite/-TestSuiteModel.test.ts`
- `code/sys/event/src/m.cmd/u.client.ts`
- `code/sys/cli/src/common/t.ts`
- `code/sys/cli/src/m.core/m.Cli/t.ts`
- `code/sys/std/src/m.Rx/u.time.ts`

Notes:

- `code/sys/http/src/common/t.ts` and `code/sys/event/src/common/t.ts` already exposed `Time` and did not require alias cleanup.
- Runtime behavior was intentionally unchanged.
- This was a type-surface migration only.

## Proof run

Completed during implementation:

```bash
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task test --trace-leaks ./src/m.Time
deno task check
```

Package checks completed:

```bash
cd /Users/phil/code/org.sys/sys/code/sys/process && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/testing && deno task check
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-automerge && deno task check
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/event && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/http && deno task check
```

Final alias scan over live `code/sys` returned no matches for removed flat aliases:

```bash
rg -n "\b(TimeLib|TimeFrameOptions|TimeUntil|TimeDelayFn|TimeDelayPromise|TimeDelay|TimeIntervalFn|TimeIntervalOptions|TimeIntervalCallback|TimeInterval|TimeDurationLib|TimeDurationOptions|TimeDurationTo|TimeInput)\b|\bt\.Time(Lib|FrameOptions|Until|DelayFn|DelayPromise|Delay|IntervalFn|IntervalOptions|IntervalCallback|Interval|DurationLib|DurationOptions|DurationTo|Input)\b" /Users/phil/code/org.sys/sys/code/sys
```

## Commit message used

```text
refactor(std)!: remove flat Time type aliases

- Move delay, interval, duration, until, and timer contracts under t.Time.*
- Delete the flat Time type files from @sys/std and expose only the Time namespace
- Migrate repo consumers to t.Time.Delay.*, t.Time.Interval.*, and t.Time.Duration.*
- Proof: std m.Time tests plus std/process/cli/testing/driver-automerge/driver-vite/event/http checks
```
