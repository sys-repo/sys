import { describe, expect, it } from '../-test.ts';
import { Path } from './m.Path.ts';
import { Yaml } from './mod.ts';

describe('Yaml.Path', () => {
  it('API', () => {
    expect(Yaml.Path).to.equal(Path);
  });

  describe('Yaml.Path.atOffset', () => {
    // Convenience: returns the offset of the first occurrence of `needle`:
    const at = (text: string, target: string) => text.indexOf(target);

    it('returns the key/value path in a simple map', () => {
      const src = 'foo: bar';
      const doc = Yaml.parseAst(src);
      const root = doc.contents!;

      // Inside key:
      expect(Path.atOffset(root, at(src, 'f'))).to.eql(['foo']);

      // Inside value:
      expect(Path.atOffset(root, at(src, 'b'))).to.eql(['foo']);
    });

    it('navigates nested maps and the key/value whitespace gap', () => {
      const src = `parent:
          child: 123
          other: true`;
      const doc = Yaml.parseAst(src);
      const root = doc.contents!;

      // Inside nested value:
      expect(Path.atOffset(root, at(src, '123'))).to.eql(['parent', 'child']);

      // Whitespace between "other:" and "true":
      const gap = src.indexOf('other:') + 'other:'.length + 1; // one char after ':'
      expect(Path.atOffset(root, gap)).to.eql(['parent', 'other']);
    });

    it('maps sequence indices correctly', () => {
      const src = `items:
          - one
          - two`;
      const doc = Yaml.parseAst(src);
      const root = doc.contents!;

      expect(Path.atOffset(root, at(src, 'one'))).to.eql(['items', 0]);

      expect(Path.atOffset(root, at(src, 'two'))).to.eql(['items', 1]);

      // Caret on the dash of the second item → inside sequence but not an item.
      const dash = src.indexOf('- two'); // position of the "-".
      expect(Path.atOffset(root, dash)).to.eql(['items']);
    });

    it('returns an empty path when offset is outside the node range', () => {
      const src = 'foo: bar';
      const doc = Yaml.parseAst(src);
      const root = doc.contents!;
      expect(
        Path.atOffset(root, src.length + 10), // Beyond EOF.
      ).to.eql([]);
    });
  });
});
