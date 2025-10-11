import { type t, describe, expect, it } from '../../../-test.ts';
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

    it('uses source-map hit (value token) when provided', () => {
      const yaml = Str.dedent(`
      root:
        doc:
          traits:
            - id: nope
              as: x
      `);
      const ast = Yaml.parseAst(yaml);

      // Fake source-map that returns a precise token position for the joined path.
      const map: t.Yaml.SourceMapLike = {
        lookup(path) {
          // Expect absolute path once basePath + relative error path are joined:
          // ['root','doc','traits',0,'id']
          if (
            Array.isArray(path) &&
            path.length === 5 &&
            path[0] === 'root' &&
            path[1] === 'doc' &&
            path[2] === 'traits' &&
            path[3] === 0 &&
            path[4] === 'id'
          ) {
            return {
              value: {
                pos: [10, 14], // arbitrary but stable in test
                linePos: [
                  { line: 4, col: 10 },
                  { line: 4, col: 14 },
                ],
              },
            };
          }
          return undefined;
        },
      };

      const errs = [{ kind: 'semantic', path: ['traits', 0, 'id'], message: 'x' }];
      attachSemanticRanges(ast, errs as any[], { basePath: ['root', 'doc'], map });

      const e = errs[0] as any;
      expect(e.path).to.eql(['root', 'doc', 'traits', 0, 'id']);
      // Must come from the map (exact numbers), not AST heuristic:
      expect(e.range).to.eql([10, 14]);
      expect(e.linePos).to.eql([
        { line: 4, col: 10 },
        { line: 4, col: 14 },
      ]);
    });

    it('falls back to AST range when source-map misses', () => {
      const yaml = Str.dedent(`
      spec:
        name: hello
      `);
      const ast = Yaml.parseAst(yaml);
      const map: t.Yaml.SourceMapLike = { lookup: () => undefined }; // Map that never hits:

      const errs = [{ kind: 'semantic', path: ['spec', 'name'], message: 'boom' }];
      attachSemanticRanges(ast, errs as any[], { map });

      const e = errs[0] as any;
      // We don’t assert exact numbers (parser dependent) — only that a range exists:
      expect(Boolean(e.range)).to.eql(true);
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
