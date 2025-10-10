import {
  type t,
  DomMock,
  MonacoFake,
  describe,
  expect,
  it,
  makeYamlErrorLinePos,
  renderHook,
} from '../../../-test.ts';
import { useYamlErrorMarkers } from '../use.YamlErrorMarkers.ts';

describe('useYamlErrorMarkers', () => {
  DomMock.polyfill();

  it('normalizes linePos → correct marker range', () => {
    const monaco = MonacoFake.monaco({ cast: true });
    const model = MonacoFake.model('a: 1\nb: 2\n');
    const editor = MonacoFake.editor(model);
    const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

    const err = makeYamlErrorLinePos('Boom', 2, 1, 3);
    renderHook((p: any) => useYamlErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [err] },
    });

    expect(spy.calls.length).to.eql(1);
    const markers = spy.calls[0]!.args[2] as t.Monaco.I.IMarkerData[];
    expect(markers.length).to.eql(1);
    const m = markers[0]!;
    expect(m.message).to.eql('Boom');
    expect(m.startLineNumber).to.eql(2);
    expect(m.startColumn).to.eql(1);
    expect(m.endLineNumber).to.eql(2);
    expect(m.endColumn).to.eql(3);

    spy.restore();
  });

  it('normalizes single linePos → zero-length marker (start==end)', () => {
    const monaco = MonacoFake.monaco({ cast: true });
    const model = MonacoFake.model('foo\nbar\n');
    const editor = MonacoFake.editor(model);
    const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

    // Fake single-tuple form (as YAML sometimes yields):
    const err = {
      name: 'YAMLParseError',
      code: 'BAD_INDENT',
      message: 'Indent',
      pos: [0, 0],
      linePos: [{ line: 1, col: 3 }],
    } as t.YamlError;

    renderHook((p: any) => useYamlErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [err] },
    });

    expect(spy.calls.length).to.eql(1);
    const m = (spy.calls[0]!.args[2] as t.Monaco.I.IMarkerData[])[0]!;
    expect(m.startLineNumber).to.eql(1);
    expect(m.startColumn).to.eql(3);
    expect(m.endLineNumber).to.eql(1);
    expect(m.endColumn).to.eql(3);

    spy.restore();
  });

  it('falls back to character offsets when no linePos', () => {
    const monaco = MonacoFake.monaco({ cast: true });
    const model = MonacoFake.model('a\nbc\n');
    const editor = MonacoFake.editor(model);
    const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

    const err: t.YamlError = {
      name: 'YAMLParseError',
      code: 'BAD_INDENT',
      message: 'Bad indentation',
      pos: [2, 4],
    };

    renderHook((p: any) => useYamlErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [err] },
    });

    expect(spy.calls.length).to.eql(1);
    const m = (spy.calls[0]!.args[2] as t.Monaco.I.IMarkerData[])[0]!;
    expect(m.message).to.eql('Bad indentation');
    expect(m.startLineNumber).to.be.a('number');
    expect(m.endLineNumber).to.be.a('number');

    spy.restore();
  });

  it('accepts mixed inputs (Diagnostic | YAMLError)', () => {
    const monaco = MonacoFake.monaco({ cast: true });
    const model = MonacoFake.model('x: 1\ny: 2\n');
    const editor = MonacoFake.editor(model);
    const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

    const diag: t.Yaml.Diagnostic = { message: 'D1', range: [0, 1] };
    const err: t.YamlError = {
      name: 'YAMLParseError',
      message: 'E1',
      code: 'X',
      pos: [2, 3],
    } as any;

    renderHook((p: any) => useYamlErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [diag, err] },
    });

    const markers = spy.calls[0]!.args[2] as t.Monaco.I.IMarkerData[];
    expect(markers.length).to.eql(2);
    expect(markers.map((m) => m.message)).to.eql(['D1', 'E1']);
    spy.restore();
  });

  it('clears markers when errors empty', () => {
    const monaco = MonacoFake.monaco({ cast: true });
    const model = MonacoFake.model('a\n');
    const editor = MonacoFake.editor(model);
    const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

    const err: t.YamlError = { name: 'YAMLParseError', message: 'boom', pos: [0, 1] } as any;
    const { rerender } = renderHook((p: any) => useYamlErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [err] },
    });
    rerender({ monaco, editor, errors: [] });

    // last call should carry empty markers
    const last = spy.calls.at(-1)!;
    expect((last.args[2] as t.Monaco.I.IMarkerData[]).length).to.eql(0);
    spy.restore();
  });

  it('keeps a stable owner across renders', () => {
    const monaco = MonacoFake.monaco({ cast: true });
    const model = MonacoFake.model('a\n');
    const editor = MonacoFake.editor(model);
    const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

    const err: t.YamlError = { name: 'YAMLParseError', message: 'x', pos: [0, 1] } as any;

    const { rerender } = renderHook((p: any) => useYamlErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [err] },
    });
    const firstOwner = spy.calls[0]!.args[1];

    rerender({ monaco, editor, errors: [err] });
    const secondOwner = spy.calls[1]!.args[1];

    expect(firstOwner).to.eql(secondOwner);
    spy.restore();
  });

  it('clears markers when enabled=false', () => {
    const monaco = MonacoFake.monaco({ cast: true });
    const model = MonacoFake.model('a\n');
    const editor = MonacoFake.editor(model);
    const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

    const err: t.YamlError = { name: 'YAMLParseError', message: 'x', pos: [0, 1] } as any;
    renderHook((p: any) => useYamlErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [err], enabled: false },
    });

    // Clears existing markers on mount:
    expect(spy.calls.length).to.eql(1);

    // Ensures markers array is empty:
    const args = spy.calls[0].args; // [model, owner, markers]
    expect(Array.isArray(args[2])).to.eql(true);
    expect(args[2].length).to.eql(0);

    spy.restore();
  });

  it('handles diagnostic range as [start,end] or [start,valueEnd,nodeEnd]', () => {
    const monaco = MonacoFake.monaco({ cast: true });
    const model = MonacoFake.model('abc\ndef\n');
    const editor = MonacoFake.editor(model);
    const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

    const d2: t.Yaml.Diagnostic = { message: 'two', range: [0, 3] };
    const d3: t.Yaml.Diagnostic = { message: 'three', range: [4, 7, 8] as any };

    renderHook((p: any) => useYamlErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [d2, d3] },
    });

    const markers = spy.calls[0]!.args[2] as t.Monaco.I.IMarkerData[];
    expect(markers.length).to.eql(2);
    expect(markers[0]!.message).to.eql('two');
    expect(markers[1]!.message).to.eql('three');
    spy.restore();
  });
});
