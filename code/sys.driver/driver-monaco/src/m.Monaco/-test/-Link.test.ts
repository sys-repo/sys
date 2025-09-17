import { type t, describe, expect, it, MonacoFake } from '../../-test.ts';
import { Link } from '../m.Link.ts';

describe('Monaco.Link', () => {
  it('toLinkBounds: carries model Uri and computes positions/offsets', () => {
    const src = ['alpha', 'bravo crdt:1234/path tango', 'charlie'].join('\n');
    const model = MonacoFake.model(src, { uri: 'inmemory://model/link' });

    // "crdt:1234/path" starts at line 2, column 7 (1-based).
    const range: t.Monaco.I.IRange = {
      startLineNumber: 2,
      startColumn: 7,
      endLineNumber: 2,
      endColumn: 22,
    };

    const b = Link.toLinkBounds({ model, range });

    // Model identity:
    expect(b.model.uri.toString()).to.eql('inmemory://model/link');

    // Positions:
    expect(b.start).to.eql({ lineNumber: 2, column: 7 });
    expect(b.end).to.eql({ lineNumber: 2, column: 22 });
    expect(b.range).to.eql(range);

    // Offsets:
    // line 1 "alpha\n" = 6 chars. startOffset = 6 + (7-1) = 12, endOffset = 6 + (22-1) = 27
    expect(b.startOffset).to.eql(12);
    expect(b.endOffset).to.eql(27);
  });

  it('linkToBounds: equals toLinkBounds(range)', () => {
    const src = 'foo crdt:abc/path bar';
    const model = MonacoFake.model(src);

    const range: t.Monaco.I.IRange = {
      startLineNumber: 1,
      startColumn: 5,
      endLineNumber: 1,
      endColumn: 18,
    };

    const asRange = Link.toLinkBounds({ model, range });

    const link: t.Monaco.I.ILink = {
      range,
      url: 'crdt:abc/path',
      tooltip: undefined,
    };

    const asLink = Link.linkToBounds({ model, link });
    expect(asLink).to.eql(asRange);
  });

  it('toRange: returns structural IRange equal to bounds.range', () => {
    const model = MonacoFake.model('x\ny\nz');
    const range: t.Monaco.I.IRange = {
      startLineNumber: 2,
      startColumn: 1,
      endLineNumber: 2,
      endColumn: 2,
    };

    const b = Link.toLinkBounds({ model, range });
    const r = Link.toRange(b);

    expect(r).to.eql(range);
    expect('startLineNumber' in r && 'endColumn' in r).to.be.true; // ← Structural (not necessarily an instance of monaco.Range):
  });

  it('toLinkBounds: collapsed range produces equal start/end and offsets', () => {
    const model = MonacoFake.model('hello\nworld');
    const range: t.Monaco.I.IRange = {
      startLineNumber: 2,
      startColumn: 3,
      endLineNumber: 2,
      endColumn: 3,
    };

    const b = Link.toLinkBounds({ model, range });
    expect(b.start).to.eql(b.end);
    expect(b.startOffset).to.eql(b.endOffset);
  });

  it('toLinkBounds: multi-line offset math holds across EOLs', () => {
    const src = ['a', 'bc', '1234'].join('\n'); // 'a\nbc\n1234'
    const model = MonacoFake.model(src, { uri: 'inmemory://model/offset-test' });

    // Pick "c" on line 2 (column 2)
    const range: t.Monaco.I.IRange = {
      startLineNumber: 2,
      startColumn: 2,
      endLineNumber: 2,
      endColumn: 3,
    };

    const b = Link.toLinkBounds({ model, range });

    // Offsets: line1 "a\n" = 2 chars; then + (col-1) = +1 → 3
    expect(b.startOffset).to.eql(3);
    expect(b.endOffset).to.eql(4);
    expect(b.model.uri.toString()).to.eql('inmemory://model/offset-test');
  });

  describe('Link.replace', () => {
    /**
     * Find first occurrence of `needle` and build bounds for it.
     */
    const makeBoundsFor = (model: t.Monaco.TextModel, needle: string): t.EditorLinkBounds => {
      const src = model.getValue();
      const idx = src.indexOf(needle);
      if (idx < 0) throw new Error(`needle not found: ${needle}`);
      const start = model.getPositionAt(idx);
      const end = model.getPositionAt(idx + needle.length);
      const range: t.Monaco.I.IRange = {
        startLineNumber: start.lineNumber,
        startColumn: start.column,
        endLineNumber: end.lineNumber,
        endColumn: end.column,
      };
      return Link.toLinkBounds({ model, range });
    };

    it('replaces text and moves caret to the end of the inserted token', () => {
      const src = 'hello crdt:abc world';
      const model = MonacoFake.model(src, { uri: 'inmemory://m/one' });
      const editor = MonacoFake.editor(model);

      const oldToken = 'crdt:abc';
      const newToken = 'crdt:0000xyz';
      const bounds = makeBoundsFor(model, oldToken);

      // Sanity check: compute where caret should land.
      const expectedPos = model.getPositionAt(bounds.startOffset + newToken.length);
      const pos = Link.replace(editor, bounds, newToken);

      // Text updated:
      expect(model.getValue()).to.equal('hello crdt:0000xyz world');

      // Return value is the end-caret:
      expect(pos.lineNumber).to.equal(expectedPos.lineNumber);
      expect(pos.column).to.equal(expectedPos.column);

      // Editor caret as well:
      const caret = editor.getPosition();
      expect(caret?.lineNumber).to.equal(expectedPos.lineNumber);
      expect(caret?.column).to.equal(expectedPos.column);
    });

    it('is a no-op when {bounds.model.uri} does not match the host editor model', () => {
      // Host editor on model A:
      const modelA = MonacoFake.model('A hello crdt:abc world', { uri: 'inmemory://m/A' });
      const editor = MonacoFake.editor(modelA);

      // Bounds built from model B (different URI):
      const modelB = MonacoFake.model('B hello crdt:abc world', { uri: 'inmemory://m/B' });
      const boundsB = makeBoundsFor(modelB, 'crdt:abc');

      // Capture pre state:
      const beforeText = modelA.getValue();
      const beforePos = editor.getPosition();

      // Attempt replace against mismatched model URI:
      const pos = Link.replace(editor, boundsB, 'crdt:xyz');

      // Host text unchanged:
      expect(modelA.getValue()).to.equal(beforeText);

      // Caret unchanged:
      const afterPos = editor.getPosition();
      expect(afterPos?.lineNumber).to.equal(beforePos?.lineNumber);
      expect(afterPos?.column).to.equal(beforePos?.column);

      // Returned position is still a Position:
      expect(pos).to.include.keys(['lineNumber', 'column']);
    });

    it('works across lines (replacement contained on a single line within a multi-line model)', () => {
      const src = ['alpha', 'bravo crdt:abc tango', 'charlie'].join('\n');
      const model = MonacoFake.model(src, { uri: 'inmemory://m/multi' });
      const editor = MonacoFake.editor(model);

      const bounds = makeBoundsFor(model, 'crdt:abc');
      const newToken = 'crdt:xyz';

      const expectedPos = model.getPositionAt(bounds.startOffset + newToken.length);
      const pos = Link.replace(editor, bounds, newToken);

      // Text updated only on line 2:
      const lines = model.getValue().split('\n');
      expect(lines[0]).to.equal('alpha');
      expect(lines[1]).to.equal('bravo crdt:xyz tango');
      expect(lines[2]).to.equal('charlie');

      // Caret at end of inserted token on line 2:
      expect(pos.lineNumber).to.equal(2);
      expect(pos.lineNumber).to.equal(expectedPos.lineNumber);
      expect(pos.column).to.equal(expectedPos.column);
    });
  });
});
