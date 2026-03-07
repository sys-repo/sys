import { type t, c, describe, expect, it } from '../../../-test.ts';
import { Composite } from '../mod.ts';

const asMs = (n: number) => n as t.Msecs;
const slice = (s: string) => s as t.TimecodeSliceString;

describe('Composite.toVirtualTimeline', () => {
  it('empty input → empty + valid (undefined)', () => {
    const out = Composite.toVirtualTimeline(undefined);
    expect(out.is.empty).to.be.true;
    expect(out.is.valid).to.be.true;
    expect(out.total).to.eql(0);
    expect(out.segments.length).to.eql(0);
    expect(out.stats).to.eql({
      pieces: 0,
      segments: 0,
      dropped: 0,
      absSlices: 0,
      open: { start: 0, end: 0, relEnd: 0 },
    });
    expect(out.issues).to.eql([]);
  });

  it('empty input → empty + valid ([])', () => {
    const out = Composite.toVirtualTimeline([]);
    expect(out.is.empty).to.be.true;
    expect(out.is.valid).to.be.true;
    expect(out.total).to.eql(0);
    expect(out.segments.length).to.eql(0);
  });

  it('absolute slice only (START..END)', () => {
    const spec: t.TimecodeCompositionSpec = [{ src: 'a', slice: slice('00:00:05..00:00:12.500') }];
    const out = Composite.toVirtualTimeline(spec);
    expect(out.is.empty).to.be.false;
    expect(out.is.valid).to.be.true;
    expect(out.segments.length).to.eql(1);
    const seg = out.segments[0];
    expect(seg.original).to.eql({ from: asMs(5000), to: asMs(12500) });
    expect(seg.virtual).to.eql({ from: asMs(0), to: asMs(7500) });
    expect(out.total).to.eql(asMs(7500));
    expect(out.issues).to.eql([]);
    expect(out.stats).to.eql({
      pieces: 1,
      segments: 1,
      dropped: 0,
      absSlices: 1,
      open: { start: 0, end: 0, relEnd: 0 },
    });
  });

  it('open end with duration ("START.." + duration)', () => {
    const spec: t.TimecodeCompositionSpec = [
      { src: 'a', slice: slice('00:00:05..'), duration: asMs(10_000) },
    ];
    const out = Composite.toVirtualTimeline(spec);
    expect(out.is.valid).to.be.true;
    expect(out.segments.length).to.eql(1);
    const seg = out.segments[0];
    expect(seg.original).to.eql({ from: asMs(5000), to: asMs(10000) });
    expect(seg.virtual).to.eql({ from: asMs(0), to: asMs(5000) });
    expect(out.stats.absSlices).to.eql(0);
    expect(out.stats.open).to.eql({ start: 0, end: 1, relEnd: 0 });
    expect(out.issues).to.eql([]);
  });

  it('open start with duration ("..END" + duration)', () => {
    const spec: t.TimecodeCompositionSpec = [
      { src: 'a', slice: slice('..00:00:10'), duration: asMs(10_000) },
    ];
    const out = Composite.toVirtualTimeline(spec);
    expect(out.is.valid).to.be.true;
    const seg = out.segments[0];
    expect(seg.original).to.eql({ from: asMs(0), to: asMs(10_000) });
    expect(out.stats.open).to.eql({ start: 1, end: 0, relEnd: 0 });
    expect(out.issues).to.eql([]);
  });

  it('relative end with duration ("START..-X" + duration)', () => {
    const spec: t.TimecodeCompositionSpec = [
      { src: 'a', slice: slice('00:00:02..-00:00:01'), duration: asMs(10_000) },
    ];
    const out = Composite.toVirtualTimeline(spec);
    expect(out.is.valid).to.be.true;
    const seg = out.segments[0];
    expect(seg.original).to.eql({ from: asMs(2000), to: asMs(9000) });
    expect(seg.virtual).to.eql({ from: asMs(0), to: asMs(7000) });
    expect(out.stats.open).to.eql({ start: 0, end: 0, relEnd: 1 });
    expect(out.issues).to.eql([]);
  });

  it('unresolved-length when no abs span and no duration', () => {
    const spec: t.TimecodeCompositionSpec = [{ src: 'a', slice: slice('00:00:05..') }];
    const out = Composite.toVirtualTimeline(spec);
    expect(out.is.valid).to.be.false;
    expect(out.segments.length).to.eql(0);
    expect(out.stats.dropped).to.eql(1);
    expect(out.issues.some((i) => i.kind === 'unresolved-length' && i.severity === 'error')).to.eql(
      true,
    );
    expect(out.issues.some((i) => i.kind === 'dropped-segment' && i.reason === 'unresolved-length'))
      .to.be.true;
  });

  it('invalid slice → dropped with error + warn', () => {
    const spec: t.TimecodeCompositionSpec = [{ src: 'a', slice: slice('not-a-slice') }];
    const out = Composite.toVirtualTimeline(spec);
    expect(out.is.valid).to.be.false;
    expect(out.stats.dropped).to.eql(1);

    expect(out.issues.some((i) => i.kind === 'invalid-slice' && i.severity === 'error')).to.be.true;
    expect(out.issues.some((i) => i.kind === 'dropped-segment' && i.reason === 'invalid-slice')).to
      .be.true;
  });

  it('zero/negative span → dropped with warn (valid remains true)', () => {
    const spec: t.TimecodeCompositionSpec = [{ src: 'a', slice: slice('00:00:05..00:00:05') }];
    const out = Composite.toVirtualTimeline(spec);
    expect(out.is.valid).to.be.true; // warn only
    expect(out.segments.length).to.eql(0);
    expect(out.stats.dropped).to.eql(1);
    expect(out.issues.some((i) => i.kind === 'zero-length-segment' && i.severity === 'warn')).to.be
      .true;
    expect(out.issues.some((i) => i.kind === 'dropped-segment' && i.reason === 'zero-length')).to.be
      .true;
  });

  it('missing src → dropped (info) and does not error', () => {
    const spec: t.TimecodeCompositionSpec = [
      { src: '   ' as t.StringRef, slice: slice('00:00:01..00:00:02') },
    ];
    const out = Composite.toVirtualTimeline(spec);
    expect(out.is.valid).to.be.true;
    expect(out.stats.dropped).to.eql(1);
    expect(out.issues).to.eql([
      { kind: 'dropped-segment', severity: 'info', src: '' as t.StringRef, reason: 'missing-src' },
    ]);
  });

  it('contiguity and total across multiple segments', () => {
    const spec: t.TimecodeCompositionSpec = [
      { src: 'a', slice: slice('00:00:01..00:00:03') }, // len 2000
      { src: 'b', duration: asMs(1000) }, // len 1000 (whole asset)
      { src: 'c', slice: slice('00:00:05..'), duration: asMs(10_000) }, // len 5000
    ];
    const out = Composite.toVirtualTimeline(spec);
    expect(out.is.valid).to.be.true;
    expect(out.segments.length).to.eql(3);
    expect(out.segments[0].virtual).to.eql({ from: asMs(0), to: asMs(2000) });
    expect(out.segments[1].virtual).to.eql({ from: asMs(2000), to: asMs(3000) });
    expect(out.segments[2].virtual).to.eql({ from: asMs(3000), to: asMs(8000) });
    expect(out.total).to.eql(asMs(8000));

    // Print:
    console.info();
    console.info(c.cyan(`Composite.${c.bold('toVirtualTimeline')} →`));
    console.info(out);
    console.info();
  });

  it('open-end without duration → unresolved-length', () => {
    const spec: t.TimecodeCompositionSpec = [{ src: 'a', slice: slice('00:00:02..') }];
    const out = Composite.toVirtualTimeline(spec);
    expect(out.is.valid).to.be.false;
    expect(out.segments.length).to.eql(0);
    expect(out.issues.some((i) => i.kind === 'unresolved-length' && i.severity === 'error')).to.eql(
      true,
    );
  });

  it('relative-end without duration → unresolved-length', () => {
    const spec: t.TimecodeCompositionSpec = [{ src: 'a', slice: slice('00:00:02..-00:00:01') }];
    const out = Composite.toVirtualTimeline(spec);
    expect(out.is.valid).to.be.false;
    expect(out.segments.length).to.eql(0);
    expect(out.issues.some((i) => i.kind === 'unresolved-length')).to.be.true;
  });
});
