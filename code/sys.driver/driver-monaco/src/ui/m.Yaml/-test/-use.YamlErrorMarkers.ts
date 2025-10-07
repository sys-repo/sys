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
    const markers = spy.calls[0]!.args[2] as readonly t.Monaco.I.IMarkerData[];
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
    } as unknown as t.YamlError;

    renderHook((p: any) => useYamlErrorMarkers(p), {
      initialProps: { monaco, editor, errors: [err] },
    });

    expect(spy.calls.length).to.eql(1);
    const m = (spy.calls[0]!.args[2] as readonly t.Monaco.I.IMarkerData[])[0]!;
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
    const m = (spy.calls[0]!.args[2] as readonly t.Monaco.I.IMarkerData[])[0]!;
    expect(m.message).to.eql('Bad indentation');
    expect(m.startLineNumber).to.be.a('number');
    expect(m.endLineNumber).to.be.a('number');

    spy.restore();
  });
});
