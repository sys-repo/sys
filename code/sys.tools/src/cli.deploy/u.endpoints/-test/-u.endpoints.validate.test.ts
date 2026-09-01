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
      expect(res.doc.staging?.dir).to.eql('./.tmp/deploy/stage');
      expect(res.doc.mappings?.[0]?.mode).to.eql('copy');
    }
  });

  it('non-descendant staging.dir → ok:false', () => {
    for (
      const dir of [
        '.',
        '../stage',
        '/tmp/stage',
        'C:/tmp/stage',
        'C:tmp/stage',
        'C:\\tmp\\stage',
        '~',
        '~/stage',
        '~user/stage',
        ' stage',
        'stage ',
        'stage/',
        'stage//nested',
        'stage/.',
        'stage.',
        'CON',
        '.sys.rooted',
        'bad:name',
      ]
    ) {
      const res = validateEndpointYamlText(
        Str.dedent(`
          staging:
            dir: '${dir}'
          mappings: []
        `),
      );
      expect(res.ok).to.eql(false);
    }
  });

  it('unsafe mapping destination → ok:false', () => {
    for (
      const staging of [
        '../output',
        '/tmp/output',
        'C:/output',
        'C:output',
        'C:\\output',
        '~/output',
        '~user/output',
        ' output',
        'output ',
        'output/',
        'output//nested',
        'output/.',
        'output.',
        'CON',
        '.sys.rooted',
        'bad:name',
        'dist.json',
        'DIST.JSON',
        'nested/index.html',
        'nested/INDEX.HTML',
        '<other>',
      ]
    ) {
      const res = validateEndpointYamlText(
        Str.dedent(`
          staging:
            dir: ./staging
          mappings:
            - mode: copy
              dir:
                source: ./src
                staging: '${staging}'
        `),
      );
      expect(res.ok).to.eql(false);
    }
  });

  it('unsafe staging-relative index sources → ok:false', () => {
    for (
      const source of [
        '../source',
        '/tmp/source',
        'C:/source',
        'C:source',
        'C:\\source',
        '~/source',
        '~user/source',
        ' source',
        'source ',
        'source/',
        'source//nested',
        'source/.',
        'CON',
        '.sys.rooted',
      ]
    ) {
      const res = validateEndpointYamlText(
        Str.dedent(`
          staging:
            dir: ./staging
          mappings:
            - mode: index
              dir:
                source: '${source}'
                staging: ./landing
        `),
      );
      expect(res.ok).to.eql(false);
    }
  });

  it('edge-whitespace source paths → ok:false', () => {
    for (const source of [' source', 'source ']) {
      const res = validateEndpointYamlText(
        Str.dedent(`
          source:
            dir: '${source}'
          staging:
            dir: ./staging
          mappings:
            - mode: copy
              dir:
                source: '${source}'
                staging: .
        `),
      );
      expect(res.ok).to.eql(false);
    }
  });

  it('allows finalizer-owned basenames as dedicated staging-root directory names', () => {
    for (const dir of ['dist.json', 'INDEX.HTML']) {
      const res = validateEndpointYamlText(
        Str.dedent(`
          staging:
            dir: '${dir}'
          mappings: []
        `),
      );
      expect(res.ok).to.eql(true);
    }
  });

  it('staging.clear → ok:false', () => {
    const res = validateEndpointYamlText(
      Str.dedent(`
        staging:
          dir: ./staging
          clear: true
        mappings: []
      `),
    );
    expect(res.ok).to.eql(false);
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
