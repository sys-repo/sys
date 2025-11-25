import { type t, Is, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Yaml } from '../mod.ts';

describe('Yaml.walk (AST)', () => {
  it('walks nested mapping with correct path semantics', () => {
    const yaml = `
      foo:
        bar:
          baz: hello
    `;

    const ast = Yaml.parseAst(yaml);
    const paths: t.ObjectPath[] = [];
    const scalars: string[] = [];

    Yaml.walk(ast, (e) => {
      const { node, path } = e;

      // Type sanity check.
      expectTypeOf(path).toEqualTypeOf<t.ObjectPath>();

      if (Yaml.Is.scalar(node) && Is.string(node.value)) {
        scalars.push(node.value);
        paths.push(path);
      }
    });

    expect(scalars).to.eql(['hello']);
    expect(paths).to.eql<t.ObjectPath[]>([['foo', 'bar', 'baz']]);
  });

  it('mutates scalar values via AST (crdt:foo → crdt:bar)', () => {
    const yaml = `
      foo:
        ref: crdt:foo
    `;

    const ast = Yaml.parseAst(yaml);

    Yaml.walk(ast, (e) => {
      const { node } = e;
      if (Yaml.Is.scalar(node) && Is.string(node.value)) {
        if (node.value === 'crdt:foo') node.value = 'crdt:bar';
      }
    });

    const res = Yaml.toJS<{ foo: { ref: string } }>(ast);
    expect(res.ok).to.eql(true);
    expect(res.data?.foo.ref).to.eql('crdt:bar');
  });

  it('handles sequences with numeric indexes in the path', () => {
    const yaml = `
      root:
        items:
          - name: first
          - name: second
    `;

    const ast = Yaml.parseAst(yaml);
    const paths: t.ObjectPath[] = [];
    const scalars: string[] = [];

    Yaml.walk(ast, (e) => {
      const { node, path } = e;

      if (Yaml.Is.scalar(node) && Is.string(node.value)) {
        scalars.push(node.value);
        paths.push(path);
      }
    });

    expect(scalars).to.eql(['first', 'second']);
    expect(paths).to.eql<t.ObjectPath[]>([
      ['root', 'items', 0, 'name'],
      ['root', 'items', 1, 'name'],
    ]);
  });

  it('provides correct parent and key for map and sequence values', () => {
    const yaml = `
      foo:
        bar:
          baz: hello
        list:
          - item1
          - item2
    `;

    const ast = Yaml.parseAst(yaml);

    type Seen = {
      readonly value: string;
      readonly path: t.ObjectPath;
      readonly key: string | number | null;
      readonly parentIsMap: boolean;
      readonly parentIsSeq: boolean;
    };

    const seen: Seen[] = [];

    Yaml.walk(ast, (e) => {
      const { node, path, key, parent } = e;

      if (Yaml.Is.scalar(node) && Is.string(node.value)) {
        seen.push({
          value: node.value,
          path,
          key,
          parentIsMap: parent !== undefined && Yaml.Is.map(parent),
          parentIsSeq: parent !== undefined && Yaml.Is.seq(parent),
        });
      }
    });

    const hello = seen.find((x) => x.value === 'hello');
    const item1 = seen.find((x) => x.value === 'item1');

    expect(hello?.path).to.eql(['foo', 'bar', 'baz']);
    expect(hello?.key).to.eql('baz');
    expect(hello?.parentIsMap).to.eql(true);
    expect(hello?.parentIsSeq).to.eql(false);

    expect(item1?.path).to.eql(['foo', 'list', 0]);
    expect(item1?.key).to.eql(0);
    expect(item1?.parentIsMap).to.eql(false);
    expect(item1?.parentIsSeq).to.eql(true);
  });

  it('supports stop() to short-circuit traversal', () => {
    const yaml = `
      foo:
        one: 1
        two: 2
        three: 3
    `;

    const ast = Yaml.parseAst(yaml);
    let visited = 0;

    Yaml.walk(ast, (e) => {
      const { node, stop } = e;

      if (Yaml.Is.scalar(node)) {
        visited += 1;
        stop(); // stop on first scalar
      }
    });

    expect(visited).to.eql(1);
  });

  it('handles root sequence, empty document, and alias nodes', () => {
    // Root sequence.
    {
      const yaml = `
        - a
        - b
      `;
      const ast = Yaml.parseAst(yaml);
      const paths: t.ObjectPath[] = [];
      const scalars: string[] = [];

      Yaml.walk(ast, (e) => {
        const { node, path } = e;
        if (Yaml.Is.scalar(node) && Is.string(node.value)) {
          scalars.push(node.value);
          paths.push(path);
        }
      });

      expect(scalars).to.eql(['a', 'b']);
      expect(paths).to.eql<t.ObjectPath[]>([[0], [1]]);
    }

    // Empty document (no events).
    {
      const yaml = ``;
      const ast = Yaml.parseAst(yaml);
      let count = 0;

      Yaml.walk(ast, () => (count += 1));
      expect(count).to.eql(0);
    }

    // Alias node appears with expected path.
    {
      const yaml = `
        base: &base
          value: 123
        alias: *base
      `;
      const ast = Yaml.parseAst(yaml);
      const aliasPaths: t.ObjectPath[] = [];

      Yaml.walk(ast, (e) => {
        if (Yaml.Is.alias(e.node)) aliasPaths.push(e.path);
      });

      expect(aliasPaths).to.eql<t.ObjectPath[]>([['alias']]);
    }
  });
});
