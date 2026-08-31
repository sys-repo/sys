import { describe, expect, it, Str } from '../../../-test.ts';
import { providerlessPrebuiltStageYaml } from '../../-test/u.fixture.ts';
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

  it('valid providerless copy stage YAML → ok:true', () => {
    const res = validateEndpointYamlText(providerlessPrebuiltStageYaml());
    expect(res.ok).to.eql(true);

    if (res.ok) {
      expect(res.doc.provider).to.eql(undefined);
      expect(res.doc.staging?.clear).to.eql(true);
      expect(res.doc.mappings?.[0]?.mode).to.eql('copy');
    }
  });

  it('empty YAML → ok:false', () => {
    const res = validateEndpointYamlText('');
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });

  it('valid YAML with r2 provider → ok:true', () => {
    const yaml = Str.dedent(`
      staging:
        dir: ./staging
      provider:
        kind: r2
        accountId: account-1
        bucket: deploy-bucket
        prefix: deploy/site
        credentials:
          accessKeyId: key-1
          secretAccessKey: secret-1
      mappings: []
    `);

    const res = validateEndpointYamlText(yaml);
    expect(res.ok).to.eql(true);

    if (res.ok) {
      expect(res.doc.provider?.kind).to.eql('r2');
      expect(res.doc.mappings ?? []).to.eql([]);
    }
  });

  it('deno provider YAML → ok:false', () => {
    const yaml = Str.dedent(`
      staging:
        dir: ./staging
      provider:
        kind: deno
        app: my-app
      mappings: []
    `);

    const res = validateEndpointYamlText(yaml);
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });

  it('discontinued orbiter provider → ok:false', () => {
    const yaml = Str.dedent(`
      staging:
        dir: ./staging
      provider:
        kind: orbiter
        siteId: site-123
        domain: example.com
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
