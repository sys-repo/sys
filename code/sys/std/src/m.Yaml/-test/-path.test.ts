import { describe, expect, it } from '../../-test.ts';
import { Path } from '../m.Path.ts';
import { Yaml } from '../mod.ts';

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

  describe('Path.atPath', () => {
    it('returns undefined for empty doc', () => {
      const ast = Yaml.parseAst('');
      const node = Path.atPath(ast, ['foo']);
      expect(node).to.eql(undefined);
    });

    it('resolves a top-level scalar', () => {
      const ast = Yaml.parseAst('id: hello');
      const node = Path.atPath(ast, ['id']);
      expect(node?.toString()).to.eql('hello');
    });

    it('resolves a nested map key', () => {
      const src = `
      root:
        child:
          value: 123
      `;
      const ast = Yaml.parseAst(src);
      const node = Path.atPath(ast, ['root', 'child', 'value']);
      expect(node?.toString()).to.eql('123');
    });

    it('resolves an array element by index', () => {
      const src = `
      items:
        - first
        - second
      `;
      const ast = Yaml.parseAst(src);
      const node = Path.atPath(ast, ['items', 1]);
      expect(node?.toString()).to.eql('second');
    });

    it('resolves a nested array element property', () => {
      const src = `
      items:
        - name: a
        - name: b
      `;
      const ast = Yaml.parseAst(src);
      const node = Path.atPath(ast, ['items', 1, 'name']);
      expect(node?.toString()).to.eql('b');
    });

    it('returns undefined for non-existent key', () => {
      const ast = Yaml.parseAst('foo: 1');
      const node = Path.atPath(ast, ['bar']);
      expect(node).to.eql(undefined);
    });

    it('returns undefined for invalid array index', () => {
      const src = `
      items:
        - one
      `;
      const ast = Yaml.parseAst(src);
      const node = Path.atPath(ast, ['items', 5]);
      expect(node).to.eql(undefined);
    });

    it('returns undefined when trying to descend into a scalar', () => {
      const ast = Yaml.parseAst('foo: bar');
      const node = Path.atPath(ast, ['foo', 'baz']);
      expect(node).to.eql(undefined);
    });
  });

  describe('Yaml.path (curried)', () => {
    it('factory: create', () => {
      const path = ['msg'];
      const p = Yaml.path(path);
      expect(p.path).to.eql(path);
      expect(p.path).to.not.equal(path);
    });

    describe('path.join(...)', () => {
      it('joins a sub-path', () => {
        const a = Yaml.path<number>(['foo']);
        expect(a.path).to.eql(['foo']);

        const b = a.join(['bar', 'zoo']);
        expect(b.path).to.eql(['foo', 'bar', 'zoo']);
      });

      it('empty sub-path', () => {
        const a = Yaml.path<number>(['foo']);
        const b = a.join([]);
        expect(a.path).to.eql(b.path);
        expect(a).to.not.equal(b); // NB: different instance.
      });
    });

    describe('path.exists', () => {
      const ast = Yaml.parseAst(`
        root:
          foo:
            msg: hello
      `);

      it('returns true for an existing path', () => {
        const p = Yaml.path(['root', 'foo', 'msg']);
        expect(p.exists(ast)).to.be.true;
      });

      it('returns false for a non-existing path', () => {
        const p = Yaml.path(['root', 'foo', 'missing']);
        expect(p.exists(ast)).to.be.false;
      });
    });

    describe('path.get', () => {
      const ast = Yaml.parseAst(`
        root:
          foo:
            msg: hello
      `);

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

    describe('path.set', () => {
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
        // After removal, index 1 should now be the old index 2 value:
        expect(p.get(doc)).to.eql(3);
      });

      describe('edge cases', () => {
        it('root-replacement ([] path)', () => {
          const doc = Yaml.parseAst(`foo: 1`);
          const p = Yaml.path([] as []);
          const op = p.set(doc, { bar: 2 });
          // → Add/update on root
          expect(doc.contents!.toJSON()).to.eql({ bar: 2 });
        });

        it('null vs. <undefined> leaf', () => {
          const doc = Yaml.parseAst(`a: null`);
          expect(Yaml.path(['a']).set(doc, null)!.type).to.eql('update');
          expect(Yaml.path(['a']).set(doc, undefined)!.type).to.eql('remove');
        });

        it('falsey but present values', () => {
          const doc = Yaml.parseAst(`x: 0\ny: ''\nz: false`);
          for (const key of ['x', 'y', 'z'] as const) {
            const p = Yaml.path([key]);
            expect(p.exists(doc)).to.be.true;
            expect(p.get(doc, 'def')).to.not.eql('def');
          }
        });

        it('out-of-bounds sequence deletion', () => {
          const doc = Yaml.parseAst(`arr: [ 1, 2 ]`);
          const op = Yaml.path(['arr', 5]).set(doc, undefined);
          expect(op).to.be.undefined;
          expect(doc.toString()).to.contain('[ 1, 2 ]'); // untouched
        });

        it('deeply nested auto-creation', () => {
          const doc = Yaml.parseAst(`{}`);
          const p = Yaml.path(['a', 'b', 0, 'c']);
          p.set(doc, 'hi');
          // → ensures foo: { b: [ { c: 'hi' } ] }
          expect(p.get(doc)).to.eql('hi');
        });

        it('full-array replace detection', () => {
          const doc = Yaml.parseAst(`arr: [1,2,3]`);
          const newArr = [4, 5, 6];
          const op = Yaml.path(['arr']).set(doc, newArr);
          expect(op!.type).to.eql('array');
          if (op?.type === 'array') {
            expect(op!.prev).to.eql([1, 2, 3]);
            expect(op!.next).to.eql(newArr);
          }
        });

        it('ensure on existing vs missing', () => {
          const doc = Yaml.parseAst(`foo: bar`);
          const p = Yaml.path(['foo']);
          expect(p.ensure(doc, 'def')).to.eql('bar');

          const q = Yaml.path(['missing']);
          expect(q.ensure(doc, 'def')).to.eql('def');
          expect(q.get(doc)).to.eql('def');
        });
      });
    });

    describe('path.ensure', () => {
      it('returns the existing value when present', () => {
        const doc = Yaml.parseAst(`foo: bar`);
        const p = Yaml.path(['foo']);
        const result = p.ensure(doc, 'fallback');
        expect(result).to.eql('bar'); // ← should not overwrite.
        expect(p.get(doc)).to.eql('bar');
      });

      it('sets and returns the default when missing', () => {
        const doc = Yaml.parseAst(`{}`);
        const p = Yaml.path(['missing']);
        const result = p.ensure(doc, 42);
        expect(result).to.eql(42);
        expect(p.get(doc)).to.eql(42); // ← now present.
      });

      it('creates intermediate structures for deep paths', () => {
        const doc = Yaml.parseAst(`{}`);
        const p = Yaml.path(['a', 'b', 0, 'c']);
        p.ensure(doc, 'hi');
        // Verify path built:
        expect(p.get(doc)).to.eql('hi');
        expect(doc.toString()).to.contain('{ a: { b: [ { c: hi } ] } }'); // ← confirm structure exists.
      });
    });

    describe('path.delete', () => {
      it('removes a top-level property from a {map}', () => {
        const doc = Yaml.parseAst(`
          foo: 1
          bar: 2
        `);
        const p = Yaml.path(['foo']);
        const op = p.delete(doc);
        expect(op).to.eql({ type: 'remove', path: ['foo'], prev: 1 });
        expect(p.exists(doc)).to.be.false;
      });

      it('removes a nested property from a {map}', () => {
        const doc = Yaml.parseAst(`
          a:
            b:
              c: 3
        `);
        const p = Yaml.path(['a', 'b', 'c']);
        const op = p.delete(doc);
        expect(op).to.eql({ type: 'remove', path: ['a', 'b', 'c'], prev: 3 });
        expect(p.exists(doc)).to.be.false;
        // Ensure parent structure still exists:
        expect(Yaml.path(['a', 'b']).exists(doc)).to.be.true;
        expect(doc.toString()).to.eql(`a:\n  b: {}\n`);
      });

      it('returns undefined when deleting a non-existent property', () => {
        const doc = Yaml.parseAst(`foo: {}`);
        const p = Yaml.path(['foo', 'baz']);
        const op = p.delete(doc);
        expect(op).to.be.undefined;
        expect(doc.toString()).to.contain('foo: {}');
      });

      it('removes an element from a sequence and shifts remaining items', () => {
        const doc = Yaml.parseAst('arr: [1, 2, 3]');
        const p = Yaml.path(['arr', 1]);
        const op = p.delete(doc);
        expect(op).to.eql({ type: 'remove', path: ['arr', 1], prev: 2 });
        // After removal, index 1 should now be the old index 2 value:
        expect(Yaml.path(['arr', 1]).get(doc)).to.eql(3);
        expect(doc.toString()).to.eql('arr: [ 1, 3 ]\n');
      });

      it('returns <undefined> when deleting an out-of-bounds sequence element', () => {
        const doc = Yaml.parseAst('arr: [1, 2]');
        const p = Yaml.path(['arr', 5]);
        const op = p.delete(doc);
        expect(op).to.be.undefined;
        expect(doc.toString()).to.contain('[ 1, 2 ]'); // ← original sequence untouched.
      });
    });
  });
});
