import { describe, it, expect, Str } from '../../../-test.ts';
import { validateEndpointYamlText } from '../mod.ts';

describe('Endpoints: validateEndpointYamlText', () => {
  it('invalid YAML → ok:false', () => {
    const res = validateEndpointYamlText('mappings: [\n');
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });

  it('schema-invalid YAML → ok:false', () => {
    const res = validateEndpointYamlText('nope: 123\n');
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });

  it('valid YAML → ok:true with doc', () => {
    const res = validateEndpointYamlText(
      Str.dedent(`
        staging:
          dir: ./staging
        mappings: []
      `),
    );
    expect(res.ok).to.eql(true);
    if (res.ok) expect(res.doc.mappings ?? []).to.eql([]);
  });

  it('empty YAML → ok:false', () => {
    const res = validateEndpointYamlText('');
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });

  it('valid YAML with orbiter provider → ok:true', () => {
    const yaml = Str.dedent(`
      staging:
        dir: ./staging
      provider:
        kind: orbiter
        siteId: site-123
        domain: fs
      mappings: []
    `);

    const res = validateEndpointYamlText(yaml);
    expect(res.ok).to.eql(true);

    if (res.ok) {
      expect(res.doc.provider?.kind).to.eql('orbiter');
      expect(res.doc.mappings ?? []).to.eql([]);
    }
  });

  it('valid YAML with deno provider and singular mapping → ok:true', () => {
    const yaml = Str.dedent(`
      staging:
        dir: ./staging
      provider:
        kind: deno
        app: my-app
      mapping:
        dir:
          source: ./pkg
          staging: .
    `);

    const res = validateEndpointYamlText(yaml);
    expect(res.ok).to.eql(true);

    if (res.ok) {
      expect(res.doc.provider?.kind).to.eql('deno');
      expect(res.doc.mapping).to.eql({ dir: { source: './pkg', staging: '.' } });
      expect(res.doc.mappings).to.eql(undefined);
    }
  });

  it('deno YAML carrying orbiter mappings → ok:false', () => {
    const yaml = Str.dedent(`
      staging:
        dir: ./staging
      provider:
        kind: deno
        app: my-app
      mappings:
        - mode: index
          dir:
            source: ./pkg
            staging: .
    `);

    const res = validateEndpointYamlText(yaml);
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });

  it('schema-invalid orbiter provider → ok:false', () => {
    const yaml = Str.dedent(`
      staging:
        dir: ./staging
      provider:
        kind: orbiter
        domain: fs
      mappings: []
    `);

    const res = validateEndpointYamlText(yaml);
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });

  it('unknown provider kind → ok:false', () => {
    const yaml = Str.dedent(`
      staging:
        dir: ./staging
      provider:
        kind: wat
      mappings: []
    `);

    const res = validateEndpointYamlText(yaml);
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });

  it('valid YAML with staging.serve.port → ok:true', () => {
    const yaml = Str.dedent(`
      staging:
        dir: ./staging
        serve:
          port: 4041
      mappings: []
    `);

    const res = validateEndpointYamlText(yaml);
    expect(res.ok).to.eql(true);

    if (res.ok) {
      expect(res.doc.staging?.serve?.port).to.eql(4041);
    }
  });
});
