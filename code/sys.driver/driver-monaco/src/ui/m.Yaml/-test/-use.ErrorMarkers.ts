import {
  type t,
  act,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  MonacoFake,
  renderHook,
} from '../../../-test.ts';
import { useErrorMarkers } from '../mod.ts';

describe('useErrorMarkers', () => {
  DomMock.polyfill();

  it('type: matches UseYamlErrorMarkers', () => {
    expectTypeOf(useErrorMarkers).toEqualTypeOf<t.UseYamlErrorMarkers>();
  });

  it('early return when monaco/editor/enabled not satisfied', () => {
    // 1) No monaco/editor: should be a no-op (just ensure it doesn't throw).
    const { result } = renderHook((p: any) => useErrorMarkers(p), {
      initialProps: { monaco: undefined, editor: undefined, errors: [] },
    });
    expect(result).to.not.equal(undefined);

    // 2) monaco present but enabled=false with no editor: still no work.
    const monaco = MonacoFake.monaco({ cast: true });
    const { result: result2 } = renderHook((p: any) => useErrorMarkers(p), {
      initialProps: { monaco, editor: undefined, enabled: false, errors: [] },
    });
    expect(result2).to.not.equal(undefined);
  });

  it('applies markers from linePos (best case)', () => {
    const monaco = MonacoFake.monaco({ cast: true });
    const model = MonacoFake.model('key: value\nfoo: bar\n');
    const editor = MonacoFake.editor(model);
    const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

    const err: t.YamlError & {
      linePos: [{ line: number; col: number }, { line: number; col: number }];
    } = {
      name: 'YAMLParseError',
      code: 'UNEXPECTED_TOKEN',
      message: 'Unexpected token',
      pos: [0, 1],
      linePos: [
        { line: 2, col: 4 },
        { line: 2, col: 10 },
      ],
    };

    renderHook((p: any) => useErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [err] as t.YamlError[] },
    });

    expect(spy.calls.length).to.equal(1);
    const markers = getMarkersArg(spy.calls[0]);
    expect(markers.length).to.equal(1);

    const m = markers[0]!;
    expect(m.message).to.equal('Unexpected token');
    expect(m.code).to.equal('UNEXPECTED_TOKEN');
    expect(m.source).to.equal('yaml');
    expect(m.severity).to.equal(monaco.MarkerSeverity.Error);
    expect(m.startLineNumber).to.equal(2);
    expect(m.startColumn).to.equal(4);
    expect(m.endLineNumber).to.equal(2);
    expect(m.endColumn).to.equal(10);

    spy.restore();
  });

  it('falls back to character offsets (pos) when linePos missing', () => {
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

    renderHook((p: any) => useErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [err] },
    });

    expect(spy.calls.length).to.equal(1);
    const markers = getMarkersArg(spy.calls[0]);
    expect(markers.length).to.equal(1);

    const m = markers[0]!;
    expect(m.message).to.equal('Bad indentation');
    expect(m.startLineNumber).to.be.a('number');
    expect(m.startColumn).to.be.a('number');
    expect(m.endLineNumber).to.be.a('number');
    expect(m.endColumn).to.be.a('number');

    spy.restore();
  });

  it('clears markers when errors = []', () => {
    const monaco = MonacoFake.monaco({ cast: true });
    const model = MonacoFake.model('x: 1');
    const editor = MonacoFake.editor(model);
    const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

    const err: t.YamlError & {
      linePos: [{ line: number; col: number }, { line: number; col: number }];
    } = {
      name: 'YAMLParseError',
      code: 'UNEXPECTED_TOKEN',
      message: 'Oops',
      pos: [0, 1],
      linePos: [
        { line: 1, col: 1 },
        { line: 1, col: 2 },
      ],
    };

    const { rerender } = renderHook((p: any) => useErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [err] },
    });

    expect(spy.calls.length).to.equal(1);
    let markers = getMarkersArg(spy.calls[0]);
    expect(markers.length).to.equal(1);

    act(() => {
      rerender({ monaco, editor, errors: [] });
    });

    expect(spy.calls.length).to.equal(2);
    markers = getMarkersArg(spy.calls[1]);
    expect(markers.length).to.equal(0);

    spy.restore();
  });

  it('clears markers when enabled toggles to false', () => {
    const monaco = MonacoFake.monaco({ cast: true });
    const model = MonacoFake.model('k: v');
    const editor = MonacoFake.editor(model);
    const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

    const err: t.YamlError & {
      linePos: [{ line: number; col: number }, { line: number; col: number }];
    } = {
      name: 'YAMLParseError',
      code: 'UNEXPECTED_TOKEN',
      message: 'Something wrong',
      pos: [0, 1],
      linePos: [
        { line: 3, col: 1 },
        { line: 3, col: 5 },
      ],
    };

    const { rerender } = renderHook((p: any) => useErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [err], enabled: true },
    });

    expect(spy.calls.length).to.equal(1);
    let markers = getMarkersArg(spy.calls[0]);
    expect(markers.length).to.equal(1);

    act(() => {
      rerender({ monaco, editor, errors: [err], enabled: false });
    });

    expect(spy.calls.length).to.equal(2);
    markers = getMarkersArg(spy.calls[1]);
    expect(markers.length).to.equal(0);

    spy.restore();
  });
});

/**
 * Helpers:
 */
function getMarkersArg(call: { args: unknown[] }) {
  return call.args[2] as readonly t.Monaco.I.IMarkerData[];
}
