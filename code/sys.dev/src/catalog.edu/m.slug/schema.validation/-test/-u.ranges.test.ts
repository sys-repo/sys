import { describe, expect, it } from '../../../-test.ts';
import { TraitRegistryDefault } from '../../mod.ts';
import { Str, Yaml } from '../common.ts';
import { attachSemanticRanges, validateWithRanges } from '../mod.ts';

describe('ranges', () => {
  describe('attachSemanticRanges', () => {
    it('no-op on empty errs', () => {
      const ast = Yaml.parseAst('a: 1\n');
      const errs: any[] = [];
      attachSemanticRanges(ast, errs);
      expect(errs).to.eql([]);
    });

    it('rewrites relative path → absolute with basePath', () => {
      const ast = Yaml.parseAst('root:\n  doc:\n    traits:\n      - id: video-player\n');
      const errs = [{ kind: 'semantic', path: ['traits', 0, 'id'], message: 'x' }];
      attachSemanticRanges(ast, errs as any[], { basePath: ['root', 'doc'] });
      expect(errs[0]!.path).to.eql(['root', 'doc', 'traits', 0, 'id']);
    });

    it('attaches range/linePos when node is found', () => {
      const ast = Yaml.parseAst('spec:\n  name: hello\n');
      const errs = [{ kind: 'semantic', path: ['spec', 'name'], message: 'boom' }];
      attachSemanticRanges(ast, errs as any[]);

      // presence check; exact numbers vary by parser:
      expect(Boolean((errs as any[])[0].range)).to.eql(true);
    });

    it('leaves range unset when node not found', () => {
      const ast = Yaml.parseAst('a: 1\n');
      const errs = [{ kind: 'semantic', path: ['missing'], message: 'nope' }];
      attachSemanticRanges(ast, errs as any[]);
      expect((errs as any[])[0].range).to.be.undefined;
    });
  });

  describe('validateWithRanges', () => {
    const registry = TraitRegistryDefault;

    it('returns [] when no semantic errors', () => {
      const yaml = Str.dedent(`
      root:
        doc:
          traits:
            - id: video-player
              as: primary
          props:
            primary:
              name: ok
      `);

      const ast = Yaml.parseAst(yaml);
      const slug = {
        id: 's1',
        traits: [{ id: 'video-player', as: 'primary' }],
        props: { primary: { name: 'ok' } },
      };

      const errs = validateWithRanges({ ast, slug, registry, basePath: ['root', 'doc'] });
      expect(errs).to.eql([]);
    });

    it('attaches range for unknown trait id (path rewritten via basePath)', () => {
      const yaml = Str.dedent(`
      root:
        doc:
          traits:
            - id: nope
              as: x
          props:
            x:
              name: ok
      `);

      const ast = Yaml.parseAst(yaml);
      const slug = {
        id: 's1',
        traits: [{ id: 'nope', as: 'x' }],
        props: { x: { name: 'ok' } },
      };

      const errs = validateWithRanges({ ast, slug, registry, basePath: ['root', 'doc'] });
      expect(errs.length).to.eql(1);

      const e = errs[0]!;
      expect(e.kind).to.eql('semantic');
      expect(e.path).to.eql(['root', 'doc', 'traits', 0, 'id']);
      expect(!!e.range).to.eql(true);
    });

    it('attaches range for invalid props shape (nested under props.<alias>.*)', () => {
      const yaml = Str.dedent(`
      traits:
        - id: video-player
          as: primary
      props:
        primary:
          name: ""
      `);

      const ast = Yaml.parseAst(yaml);
      const slug = {
        id: 's1',
        traits: [{ id: 'video-player', as: 'primary' }],
        props: { primary: { name: '' } }, // violates minLength: 1
      };

      const errs = validateWithRanges({ ast, slug, registry });
      expect(errs.length).to.eql(1);

      const e = errs[0]!;
      expect(e.path).to.eql(['props', 'primary', 'name']);
      expect(!!e.range).to.eql(true);
    });

    it('leaves range unset when path cannot be located in AST', () => {
      const yaml = Str.dedent(`
      a: 1
      `);

      const ast = Yaml.parseAst(yaml);
      const slug = { id: 's1', traits: [{ id: 'nope', as: 'x' }] };
      const errs = validateWithRanges({ ast, slug, registry });

      expect(errs.length).to.be.greaterThan(0);
      expect(errs[0].range).to.be.undefined;
    });
  });
});
