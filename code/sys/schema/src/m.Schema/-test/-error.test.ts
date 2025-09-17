import { Yaml, describe, expect, it } from '../../-test.ts';
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
      expect(err.range === undefined || Array.isArray(err.range)).to.be.true;
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
      expect(err.range === undefined || Array.isArray(err.range)).to.be.true;
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
      expect(mapped[0].range === undefined || Array.isArray(mapped[0].range)).to.be.true;
    });
  });
});
