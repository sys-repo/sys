import { type t, Arr, describe, expect, expectTypeOf, it, Yaml } from '../../-test.ts';
import { ErrorMapper, Schema } from '../mod.ts';

describe('Schema: errors', () => {
  it('API', () => {
    expect(Schema.ErrorMapper).to.equal(ErrorMapper);
  });

  describe('ErrorMapper', () => {
    it('maps schema errors with ranges', () => {
      const src = `
      slug:
        id: 123        # should be string
        traits: {}     # should be array
      `;
      const ast = Yaml.parseAst(src);
      const data = ast.toJS();

      const T = Schema.Type;
      const SlugSchema = T.Object(
        {
          slug: T.Object({
            id: T.String(),
            traits: T.Array(T.Unknown()),
          }),
        },
        { additionalProperties: false },
      );

      const errors = Schema.Value.Errors(SlugSchema, data);
      const mapped = Schema.ErrorMapper.schema(ast, errors);
      expect(mapped.length).to.be.greaterThan(0);

      const err = mapped[0];
      // Assert shape includes `kind`
      expect(err).to.have.keys(['kind', 'path', 'message', 'range']);
      expect(err.kind).to.equal('schema');
      expect(err.path).to.be.an('array');
      expect(err.message).to.be.a('string');
      expect(err.range === undefined || Arr.isArray(err.range)).to.be.true;
    });

    it('maps YAML parse errors', () => {
      const badSrc = `id: [unclosed`;
      const ast = Yaml.parseAst(badSrc);

      const mapped = Schema.ErrorMapper.yaml(ast.errors);
      expect(mapped.length).to.be.greaterThan(0);

      const err = mapped[0];
      // Assert shape includes `kind` + `yaml`
      expect(err).to.have.keys(['kind', 'yaml', 'path', 'message', 'range']);
      expect(err.kind).to.equal('yaml');
      expect(err.path).to.eql([]); // parser errors aren’t path-specific
      expect(err.message).to.include('unclosed');
      expect(err.range === undefined || Arr.isArray(err.range)).to.be.true;
    });

    it('schema mapping falls back when node not found', () => {
      const src = `x: 1`;
      const ast = Yaml.parseAst(src);

      const fakeErrors = [
        {
          path: '/slug/does/not/exist',
          message: 'Nope',
        },
      ] as any;

      const mapped = Schema.ErrorMapper.schema(ast, fakeErrors);

      expect(mapped.length).to.eql(1);
      expect(mapped[0].kind).to.equal('schema');
      expect(mapped[0].path).to.eql(['slug', 'does', 'not', 'exist']);
      expect(mapped[0].message).to.eql('Nope');
      expect(mapped[0].range === undefined || Arr.isArray(mapped[0].range)).to.be.true;
    });
  });

  describe('SchemaError type system', () => {
    it('SchemaError discriminates by `kind`', () => {
      const src = `id: [unclosed`;
      const ast = Yaml.parseAst(src);
      const errs = Schema.ErrorMapper.yaml(ast.errors);
      const e = errs[0];

      // Runtime checks
      expect(e.kind).to.equal('yaml');
      expect('yaml' in e).to.equal(true);
      expect(e.yaml).to.equal(ast.errors[0]); // same reference

      // Type checks (narrowing)
      if (e.kind === 'yaml') {
        expectTypeOf(e.yaml).toEqualTypeOf<(typeof ast.errors)[number]>();
      }
    });

    it('propagates range when present (schema + yaml)', () => {
      const src = `
      slug:
        id: 123
        traits: {}
      `;
      const ast = Yaml.parseAst(src);
      const T = Schema.Type;
      const S = T.Object({ slug: T.Object({ id: T.String(), traits: T.Array(T.Unknown()) }) });

      const mappedSchema = Schema.ErrorMapper.schema(ast, Schema.Value.Errors(S, ast.toJS()));
      expect(mappedSchema.length).to.be.greaterThan(0);
      // Range can be undefined for some paths; at least one should have a tuple
      expect(mappedSchema.some((e) => Arr.isArray(e.range))).to.equal(true);

      const astBad = Yaml.parseAst(`id: [unclosed`);
      const mappedYaml = Schema.ErrorMapper.yaml(astBad.errors);
      expect(mappedYaml.length).to.be.greaterThan(0);

      // YAML parser often provides a range for syntax errors; optional:
      expect(mappedYaml.every((e) => e.kind === 'yaml')).to.equal(true);
      expect(mappedYaml.every((e) => e.range === undefined || Arr.isArray(e.range))).to.eql(true);
    });

    it('schema mapping falls back on missing array index', () => {
      const ast = Yaml.parseAst(`items:\n  - a\n`);
      const fake = [{ path: '/items/5', message: 'out of range' }] as any;
      const mapped = Schema.ErrorMapper.schema(ast, fake);
      expect(mapped[0].path).to.eql(['items', 5]);
      expect(mapped[0].range === undefined || Array.isArray(mapped[0].range)).to.equal(true);
    });

    it('does not mutate input error arrays', () => {
      const ast = Yaml.parseAst(`id: [unclosed`);
      const original = [...ast.errors];
      Schema.ErrorMapper.yaml(ast.errors);
      expect(ast.errors).to.eql(original); //         ← structural equality.
      expect(ast.errors[0]).to.equal(original[0]); // ← identity.
    });

    it('empty inputs return empty outputs', () => {
      const ast = Yaml.parseAst(`ok: true`);
      const s = Schema.ErrorMapper.schema(ast, []);
      const y = Schema.ErrorMapper.yaml([]);
      expect(s.length).to.equal(0);
      expect(y.length).to.equal(0);
    });

    it('preserves error ordering', () => {
      const ast = Yaml.parseAst(`a: 1\nb: 2\nc: 3`);
      const fake = [
        { path: '/c', message: 'C' },
        { path: '/a', message: 'A' },
        { path: '/b', message: 'B' },
      ] as any;

      const mapped = Schema.ErrorMapper.schema(ast, fake);
      expect(mapped.map((e) => e.message)).to.eql(['C', 'A', 'B']);
    });

    it('semantic kind shape', () => {
      const err: t.SchemaValidationError = {
        kind: 'semantic',
        path: ['traits', 0, 'as'],
        message: 'Duplicate alias "video"',
        range: undefined,
      };
      expect(err.kind).to.equal('semantic');
      expectTypeOf(err.path).toEqualTypeOf<(string | number)[]>();
    });
  });
});
