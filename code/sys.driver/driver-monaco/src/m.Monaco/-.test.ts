import { type t, describe, expect, it, MonacoFake } from '../-test.ts';
import { EditorCrdt, EditorYaml, MonacoEditor, YamlEditor } from '../ui/mod.ts';

import { Link } from './m.Link.ts';
import { Monaco, MonacoIs } from './mod.ts';

describe('Monaco', () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco');
    expect(m.Monaco).to.equal(Monaco);

    expect(Monaco.Editor).to.equal(MonacoEditor);
    expect(Monaco.Crdt).to.equal(EditorCrdt);
    expect(Monaco.Yaml).to.equal(EditorYaml);
    expect(Monaco.Yaml.Editor).to.equal(YamlEditor);
    expect(Monaco.Is).to.equal(MonacoIs);
    expect(Monaco.Link).to.equal(Link);
  });

  describe('Monaco.Link', () => {
    it('toLinkBounds: carries modelUri and computes positions/offsets', () => {
      const src = ['alpha', 'bravo crdt:1234/path tango', 'charlie'].join('\n');
      const model = MonacoFake.model(src, { uri: 'inmemory://model/link' });

      // "crdt:1234/path" starts at line 2, column 7 (1-based)
      const range: t.Monaco.I.IRange = {
        startLineNumber: 2,
        startColumn: 7,
        endLineNumber: 2,
        endColumn: 22,
      };

      const b = Link.toLinkBounds({ model, range });

      // Model identity:
      expect(b.modelUri.toString()).to.eql('inmemory://model/link');

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
      const src = 'foo crdt:abc/state bar';
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
        url: 'crdt:abc/state',
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
      // Structural (not necessarily an instance of monaco.Range):
      expect('startLineNumber' in r && 'endColumn' in r).to.be.true;
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
      expect(b.modelUri.toString()).to.eql('inmemory://model/offset-test');
    });
  });
});
