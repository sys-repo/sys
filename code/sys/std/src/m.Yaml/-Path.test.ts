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
          expect(Yaml.path(['n']).get(ast, 'def')).to.eql(null);
          expect(Yaml.path(['nop']).get(ast, 'def')).to.eql('def');
        });

        it('sequence indexing + out-of-bounds', () => {
          const ast = Yaml.parseAst('arr: [a, b]');
          expect(Yaml.path(['arr', 1]).get(ast)).to.eql('b');
          expect(Yaml.path(['arr', 2]).get(ast)).to.be.undefined;
        });

        it('subject undefined', () => {
          expect(Yaml.path(['foo']).get(undefined, 'x')).to.eql('x');
        });
      });
    });

    describe('Path.set', () => {
      it('adds a new property to a nested {map}', () => {
        const doc = Yaml.parseAst(`
          foo: {}
        `);

        const p = Yaml.path(['foo', 'bar']);
        const op = p.set(doc, 42);
        expect(op).to.eql({ type: 'add', path: ['foo', 'bar'], value: 42 });
        expect(p.get(doc)).to.eql(42);
      });

      it('updates an existing property in a {map}', () => {
        const doc = Yaml.parseAst(`
          foo:
            bar: 'old'
        `);

        const p = Yaml.path(['foo', 'bar']);
        const op = p.set(doc, 'new');
        expect(op).to.eql({ type: 'update', path: ['foo', 'bar'], prev: 'old', next: 'new' });
        expect(p.get(doc)).to.eql('new');
      });

      it('removes a property when setting <undefined>', () => {
        const doc = Yaml.parseAst(`
          foo:
            bar: 'baz'
        `);

        const p = Yaml.path(['foo', 'bar']);
        const op = p.set(doc, undefined);
        expect(op).to.eql({ type: 'remove', path: ['foo', 'bar'], prev: 'baz' });
        expect(p.get(doc)).to.be.undefined;
      });

      it('updates an element in a [sequence]', () => {
        const doc = Yaml.parseAst(`
          arr: [1, 2]
        `);

        const p = Yaml.path(['arr', 0]);
        const op = p.set(doc, 9);
        expect(op).to.eql({ type: 'update', path: ['arr', 0], prev: 1, next: 9 });
        expect(p.get(doc)).to.eql(9);
      });

      it('appends to a [sequence] when index equals length', () => {
        const doc = Yaml.parseAst(`
          arr: [1, 2]
        `);

        const p = Yaml.path(['arr', 2]);
        const op = p.set(doc, 3);
        expect(op).to.eql({ type: 'add', path: ['arr', 2], value: 3 });
        expect(p.get(doc)).to.eql(3);
      });

      it('removes an element from a [sequence] when value is <undefined>', () => {
        const doc = Yaml.parseAst(`
          arr: [1, 2, 3]
        `);

        const p = Yaml.path(['arr', 1]);
        const op = p.set(doc, undefined);
        expect(op).to.eql({ type: 'remove', path: ['arr', 1], prev: 2 });
        // after removal, index 1 should now be the old index 2 value
        expect(p.get(doc)).to.eql(3);
      });
    });
  });
});
