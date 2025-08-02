import { describe, expect, it } from '../-test.ts';
import { Path } from './m.Path.ts';
import { Yaml } from './mod.ts';

describe('Yaml.Path', () => {
  it('API', () => {
    expect(Yaml.Path).to.equal(Path);
    expect(Yaml.path).to.equal(Path.create);
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

  describe('Yaml.Path', () => {
    it('factory: create', () => {
      const path = ['msg'];
      const p = Yaml.path(path);
      expect(p.path).to.equal(path);
    });

    const ast = Yaml.parseAst(`
      root:
        foo:
          msg: hello
    `);

    describe('Path.exists', () => {
      it('returns true for an existing path', () => {
        const p = Yaml.path(['root', 'foo', 'msg']);
        expect(p.exists(ast)).to.be.true;
      });

      it('returns false for a non-existing path', () => {
        const p = Yaml.path(['root', 'foo', 'missing']);
        expect(p.exists(ast)).to.be.false;
      });
    });

    describe('Path.get', () => {
      it('returns <value> when path exists without <default>', () => {
        const p = Yaml.path(['root', 'foo', 'msg']);
        const result = p.get(ast);
        expect(result).to.eql('hello');
      });

      it('returns <undefined> when path missing without <default>', () => {
        const p = Yaml.path<string>(['root', 'foo', 'missing']);
        const result = p.get(ast);
        expect(result).to.be.undefined;
      });

      it('returns <default> when path missing with <default>', () => {
        const p = Yaml.path<string>(['root', 'foo', 'missing']);
        const result = p.get(ast, 'fallback');
        expect(result).to.eql('fallback');
      });

      describe('edge cases', () => {
        it('empty path', () => {
          const p = Yaml.path([]);
          expect(p.get(ast)).to.eql(ast.contents);
        });

        it('root-level scalar', () => {
          const ast = Yaml.parseAst("val: 0\nboo: false\nstr: ''");
          expect(Yaml.path(['val']).get(ast)).to.eql(0);
          expect(Yaml.path(['boo']).get(ast)).to.eql(false);
          expect(Yaml.path(['str']).get(ast)).to.eql('');
        });

        it('null value vs. missing key', () => {
          const ast = Yaml.parseAst('n: null');
          expect(Yaml.path(['n']).get(ast, 'def')).to.equal(null);
          expect(Yaml.path(['nop']).get(ast, 'def')).to.equal('def');
        });

        it('sequence indexing + out-of-bounds', () => {
          const ast = Yaml.parseAst('arr: [a, b]');
          expect(Yaml.path(['arr', 1]).get(ast)).to.equal('b');
          expect(Yaml.path(['arr', 2]).get(ast)).to.be.undefined;
        });

        it('subject undefined', () => {
          expect(Yaml.path(['foo']).get(undefined, 'x')).to.eql('x');
        });
      });
    });
  });
});
