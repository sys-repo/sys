import { describe, expect, it } from '../../../-test.ts';
import { makeRegistry, Str, Type as T, Yaml } from '../common.ts';
import { attachSemanticRanges, validateWithRanges } from '../mod.ts';

describe('ranges', () => {
  const registry = makeRegistry([
    {
      id: 'trait-alpha',
      propsSchema: T.Object({
        name: T.Optional(T.String({ minLength: 1 })),
        description: T.Optional(T.String()),
        src: T.Optional(T.String()),
      }),
    },
  ]);

  describe('attachSemanticRanges', () => {
    it('no-op on empty errs', () => {
      const ast = Yaml.parseAst('a: 1\n');
      const errs: any[] = [];
      attachSemanticRanges(ast, errs);
      expect(errs).to.eql([]);
    });

    it('rewrites relative path → absolute with basePath', () => {
      const ast = Yaml.parseAst(`
        root:
          doc:
            traits:
              - of: trait-alpha
        `);
      const errs = [{ kind: 'semantic', path: ['traits', 0, 'of'], message: 'x' }];
      attachSemanticRanges(ast, errs as any[], { basePath: ['root', 'doc'] });
      expect(errs[0]!.path).to.eql(['root', 'doc', 'traits', 0, 'of']);
    });

    it('attaches range/linePos when node is found', () => {
      const ast = Yaml.parseAst(`
        spec:
          name: hello
      `);
      const errs = [{ kind: 'semantic', path: ['spec', 'name'], message: 'boom' }];
      attachSemanticRanges(ast, errs as any[]);
      expect(Boolean((errs as any[])[0].range)).to.eql(true);
    });

    it('leaves range unset when node not found', () => {
      const ast = Yaml.parseAst('a: 1');
      const errs = [{ kind: 'semantic', path: ['missing'], message: 'nope' }];
      attachSemanticRanges(ast, errs as any[]);
      expect((errs as any[])[0].range).to.be.undefined;
    });
  });

  describe('validateWithRanges', () => {
    it('returns [] when no semantic errors', () => {
      const yaml = Str.dedent(`
      root:
        doc:
          traits:
            - of: trait-alpha
              as: primary
          data:
            primary:
              name: ok
      `);

      const ast = Yaml.parseAst(yaml);
      const slug = {
        id: 's1',
        traits: [{ of: 'trait-alpha', as: 'primary' }],
        data: { primary: { name: 'ok' } },
      };

      const errs = validateWithRanges({ ast, slug, registry, basePath: ['root', 'doc'] });
      expect(errs).to.eql([]);
    });

    it('attaches range for unknown trait id (path rewritten via basePath)', () => {
      const yaml = Str.dedent(`
      root:
        doc:
          traits:
            - of: nope
              as: x
          data:
            x:
              name: ok
      `);

      const ast = Yaml.parseAst(yaml);
      const slug = {
        id: 's1',
        traits: [{ of: 'nope', as: 'x' }],
        data: { x: { name: 'ok' } },
      };

      const errs = validateWithRanges({ ast, slug, registry, basePath: ['root', 'doc'] });
      expect(errs.length).to.eql(1);

      const e = errs[0]!;
      expect(e.kind).to.eql('semantic');
      expect(e.path).to.eql(['root', 'doc', 'traits', 0, 'of']);
      expect(!!(e as any).range).to.eql(true);
    });

    it('attaches range for invalid data shape (nested under data.<alias>.*)', () => {
      const yaml = Str.dedent(`
        traits:
          - of: trait-alpha
            as: primary
        data:
          primary:
            name: ""
      `);

      const ast = Yaml.parseAst(yaml);
      const slug = {
        id: 's1',
        traits: [{ of: 'trait-alpha', as: 'primary' }],
        data: { primary: { name: '' } }, // violates minLength: 1
      };

      const errs = validateWithRanges({ ast, slug, registry });
      expect(errs.length).to.eql(1);

      const e = errs[0]!;
      expect(e.path).to.eql(['data', 'primary', 'name']);
      expect(!!(e as any).range).to.eql(true);
    });

    it('leaves range unset when path cannot be located in AST', () => {
      const ast = Yaml.parseAst('a: 1');
      const slug = { id: 's1', traits: [{ of: 'nope', as: 'x' }] };
      const errs = validateWithRanges({ ast, slug, registry });
      expect(errs.length).to.be.greaterThan(0);
      expect((errs[0] as any).range).to.be.undefined;
    });
  });
});
