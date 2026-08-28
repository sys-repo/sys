import { AliasResolver } from '../m.Alias/m.AliasResolver.ts';
import { AliasIs } from '../m.Alias/m.Is.ts';
import { Args } from '../m.Args/mod.ts';
import { Arr } from '../m.Arr/m.Arr.ts';
import { Await } from '../m.Async.Await/m.Await.ts';
import { Schedule } from '../m.Async.Schedule/m.Schedule.ts';
import { Lease } from '../m.Async/m.Lease.ts';
import { Bytes } from '../m.Bytes/m.Bytes.ts';
import { Delete } from '../m.Delete/Delete.ts';
import { Dispose } from '../m.Dispose/m.Dispose.ts';
import { Causal } from '../m.Effect/m.Causal.ts';
import { Effect } from '../m.Effect/mod.ts';
import { EffectController } from '../m.EffectController/m.EffectController.ts';
import { Eql } from '../m.Eql/m.Eql.ts';
import { Is as ErrIs } from '../m.Err/m.Is.ts';
import { Name as ErrName } from '../m.Err/m.Name.ts';
import { Err } from '../m.Err/m.Err.ts';
import { Fn } from '../m.Fn/mod.ts';
import { Glob } from '../m.Glob/mod.ts';
import { History } from '../m.History/m.History.ts';
import { Ignore } from '../m.Ignore/m.Ignore.ts';
import { IndexedDb } from '../m.IndexedDb/m.IndexedDb.ts';
import { Is } from '../m.Is/m.Is.ts';
import { Json } from '../m.Json/m.Json.ts';
import { Lazy } from '../m.Lazy/m.Lazy.ts';
import { Log } from '../m.Log/m.Log.ts';
import { Fallback } from '../m.MediaType/m.Fallback.ts';
import { MediaType } from '../m.MediaType/m.MediaType.ts';
import { Is as MediaTypeIs } from '../m.MediaType/m.Is.ts';
import { Is as NumIs } from '../m.Num/m.Is.ts';
import { Num } from '../m.Num/m.Num.ts';
import { Is as PercentIs } from '../m.Num/m.Percent/m.Is.ts';
import { Percent } from '../m.Num/m.Percent/mod.ts';
import { Range } from '../m.Num/m.Percent/m.Range.ts';
import { Ratio } from '../m.Num/m.Ratio.ts';
import { Obj } from '../m.Obj/m.Obj.ts';
import { Is as LensIs } from '../m.Obj.Lens/m.Is.ts';
import { Lens } from '../m.Obj.Lens/m.Lens.ts';
import { Codec } from '../m.Obj.Path/m.Codec.ts';
import { CurriedPath } from '../m.Obj.Path/m.CurriedPath.ts';
import { Is as PathIs } from '../m.Obj.Path/m.Is.ts';
import { Mutate } from '../m.Obj.Path/m.Mutate.ts';
import { Path as ObjPath } from '../m.Obj.Path/m.Path.ts';
import { Rel } from '../m.Obj.Path/m.Rel.ts';
import { Bounded } from '../m.Path/m/m.Bounded.ts';
import { Format as PathFormat } from '../m.Path/m/m.Fmt.ts';
import { Is as PathValueIs } from '../m.Path/m/m.Is.ts';
import { Join } from '../m.Path/m/m.Join.ts';
import { Path as PathValue } from '../m.Path/m/m.Path.ts';
import { Part } from '../m.Pkg/m/m.Dist.Part.ts';
import { Dist } from '../m.Pkg/m/m.Dist.ts';
import { PkgIs } from '../m.Pkg/m/m.Is.ts';
import { Pkg } from '../m.Pkg/m/m.Pkg.ts';
import { Subpath } from '../m.Pkg/m/m.Subpath.ts';
import { Length } from '../m.Random/common.ts';
import { Random } from '../m.Random/mod.ts';
import { Regex } from '../m.Regex/mod.ts';
import { Is as RxIs } from '../m.Rx/m.Rx.Is.ts';
import { Rx } from '../m.Rx/m.Rx.ts';
import { Release } from '../m.Semver/common.ts';
import { Is as SemverIs } from '../m.Semver/m.Is.ts';
import { Prefix } from '../m.Semver/m.Prefix.ts';
import { Fmt } from '../m.Semver.Server/m.Fmt.ts';
import { Semver as ServerSemver } from '../m.Semver.Server/mod.ts';
import { Semver } from '../m.Semver/mod.ts';
import { Sha256 } from '../m.Shard/m.Sha256.ts';
import { Shard } from '../m.Shard/m.Shard.ts';
import { Is as SignalIs } from '../m.Signal/m.Is.ts';
import { Signal } from '../m.Signal/m.Signal.ts';
import { Compare } from '../m.Str/m.Compare.ts';
import { Lorem } from '../m.Str/m.Lorem.ts';
import { Str } from '../m.Str/m.Str.ts';
import { Testing } from '../m.Testing/m.Testing.ts';
import { Fake } from '../m.Testing.DomMock/m.Fake.ts';
import { Keyboard } from '../m.Testing.DomMock/m.Keyboard.ts';
import { Mouse } from '../m.Testing.DomMock/m.Mouse.ts';
import { DomMock } from '../m.Testing.DomMock/mod.ts';
import { TestHttpServer } from '../m.Testing.Server/m.HttpServer.ts';
import { TestServer } from '../m.Testing.Server/m.Server.ts';
import { Testing as ServerTesting } from '../m.Testing.Server/mod.ts';
import { Time } from '../m.Time/m.Time.ts';
import { Duration } from '../m.Time/m.Time.Duration.ts';
import { Day } from '../m.Time.Date/m.Date.Day.ts';
import { Format as DateFormat } from '../m.Time.Date/m.Date.Format.ts';
import { Is as DateIs } from '../m.Time.Date/m.Date.Is.ts';
import { Date as TimeDate } from '../m.Time.Date/m.Date.ts';
import { VClock } from '../m.Timecode/clock/m.VClock.ts';
import { VTime } from '../m.Timecode/clock/m.VTime.ts';
import { Map } from '../m.Timecode/composite/m.Map.ts';
import { Durations } from '../m.Timecode/composite/u.duration.ts';
import { Ops as CompositeOps } from '../m.Timecode/composite/u.ops.ts';
import { Time as CompositeTime } from '../m.Timecode/composite/u.time.ts';
import { Ops as TimecodeOps } from '../m.Timecode/core.ops/mod.ts';
import { Experience } from '../m.Timecode/experience/m.Experience.ts';
import { Pattern } from '../m.Timecode/m.Pattern.ts';
import { Composite } from '../m.Timecode/composite/m.Composite.ts';
import { Timecode } from '../m.Timecode/m.Timecode.ts';
import { Slice } from '../m.Timecode/slice/mod.ts';
import { Try } from '../m.Try/mod.ts';
import { Url } from '../m.Url/m.Url.ts';
import { Is as JsrPkgIs } from '../m.Url.Jsr/m.Url.Pkg.Is.ts';
import { Pkg as JsrPkg } from '../m.Url.Jsr/m.Url.Pkg.ts';
import { JsrUrl } from '../m.Url.Jsr/m.Url.ts';
import { Is as XmlIs } from '../m.Xml/m.Is.ts';
import { Xml } from '../m.Xml/mod.ts';
import { describe, expect, it } from '../-test.ts';

describe('namespace freeze', () => {
  it('freezes each terminal public namespace', () => {
    const values: readonly [string, object][] = [
      ['Alias.Is', AliasIs],
      ['Arr', Arr],
      ['Args', Args],
      ['Await', Await],
      ['Schedule', Schedule],
      ['Lease', Lease],
      ['Bytes', Bytes],
      ['Delete', Delete],
      ['Dispose', Dispose],
      ['Effect.Causal', Causal],
      ['EffectController', EffectController],
      ['Eql', Eql],
      ['Err.Is', ErrIs],
      ['Err.Name', ErrName],
      ['Fn', Fn],
      ['Glob', Glob],
      ['History', History],
      ['Ignore', Ignore],
      ['IndexedDb.Record', IndexedDb.Record],
      ['IndexedDb.Database', IndexedDb.Database],
      ['Is', Is],
      ['Json', Json],
      ['Lazy', Lazy],
      ['Log', Log],
      ['MediaType.Fallback', Fallback],
      ['MediaType.Is', MediaTypeIs],
      ['Num.Is', NumIs],
      ['Num.Percent.Is', PercentIs],
      ['Num.Percent.Range', Range],
      ['Num.Ratio', Ratio],
      ['Obj.Lens.Is', LensIs],
      ['Obj.Lens.Readonly', Lens.Readonly],
      ['Obj.Path.Codec', Codec],
      ['Obj.Path.Curried', CurriedPath],
      ['Obj.Path.Is', PathIs],
      ['Obj.Path.Mutate', Mutate],
      ['Obj.Path.Rel', Rel],
      ['Path.Bounded', Bounded],
      ['Path.Format', PathFormat],
      ['Path.Is', PathValueIs],
      ['Path.Join', Join],
      ['Pkg.Dist.Part', Part],
      ['Pkg.Dist.Compat', Dist.Compat],
      ['Pkg.Dist.Is', Dist.Is],
      ['Pkg.Is', PkgIs],
      ['Pkg.Subpath', Subpath],
      ['Random.Length', Length],
      ['Regex', Regex],
      ['Rx.Is', RxIs],
      ['Semver.Release', Release],
      ['Semver.Is', SemverIs],
      ['Semver.Prefix', Prefix],
      ['Semver.Server.Fmt', Fmt],
      ['Shard.Sha256', Sha256],
      ['Signal.Is', SignalIs],
      ['Str.Compare', Compare],
      ['Str.Lorem', Lorem],
      ['DomMock.Fake.Media', Fake.Media],
      ['DomMock.Keyboard', Keyboard],
      ['DomMock.Mouse', Mouse],
      ['Testing.Http', TestHttpServer],
      ['Testing.Server.internal', TestServer],
      ['Time.Duration.To', Duration.To],
      ['Time.Date.Day', Day],
      ['Time.Date.Format', DateFormat],
      ['Time.Date.Is', DateIs],
      ['Timecode.VClock', VClock],
      ['Timecode.VTime', VTime],
      ['Timecode.Composite.Map', Map],
      ['Timecode.Composite.Durations', Durations],
      ['Timecode.Composite.Ops', CompositeOps],
      ['Timecode.Composite.Time', CompositeTime],
      ['Timecode.Ops', TimecodeOps],
      ['Timecode.Experience', Experience],
      ['Timecode.Pattern', Pattern],
      ['Timecode.Slice', Slice],
      ['Try', Try],
      ['Url', Url],
      ['JsrUrl.Pkg.Is', JsrPkgIs],
      ['Xml.Is', XmlIs],
    ];

    for (const [label, value] of values) {
      expect(Object.isFrozen(value), label).to.eql(true);
    }
  });

  it('freezes each intermediate public namespace', () => {
    const values: readonly [string, object][] = [
      ['Num.Percent', Percent],
      ['Obj.Lens', Lens],
      ['Obj.Path', ObjPath],
      ['Pkg.Dist', Dist],
      ['Semver', Semver],
      ['Testing', Testing],
      ['DomMock.Fake', Fake],
      ['Time.Delay', Time.Delay],
      ['Time.Duration', Duration],
      ['Time.Date', TimeDate],
      ['Timecode.Composite', Composite],
      ['JsrUrl.Pkg', JsrPkg],
    ];

    for (const [label, value] of values) {
      expect(Object.isFrozen(value), label).to.eql(true);
    }
  });

  it('freezes each public namespace root', () => {
    const values: readonly [string, object][] = [
      ['AliasResolver', AliasResolver],
      ['Effect', Effect],
      ['Err', Err],
      ['IndexedDb', IndexedDb],
      ['MediaType', MediaType],
      ['Num', Num],
      ['Obj', Obj],
      ['Path', PathValue],
      ['Pkg', Pkg],
      ['Random', Random],
      ['Rx', Rx],
      ['Semver.Server', ServerSemver],
      ['Shard', Shard],
      ['Signal', Signal],
      ['Str', Str],
      ['DomMock', DomMock],
      ['Testing.Server', ServerTesting],
      ['Time', Time],
      ['Timecode', Timecode],
      ['JsrUrl', JsrUrl],
      ['Xml', Xml],
    ];

    for (const [label, value] of values) {
      expect(Object.isFrozen(value), label).to.eql(true);
    }
  });
});
