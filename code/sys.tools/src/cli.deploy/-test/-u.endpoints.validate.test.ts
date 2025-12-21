import { describe, it, expect } from '../../-test.ts';
import { validateEndpointYamlText } from '../u.endpoints.validate.ts';

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
    const res = validateEndpointYamlText('mappings: []\n');
    expect(res.ok).to.eql(true);
    if (res.ok) expect(res.doc.mappings ?? []).to.eql([]);
  });

  it('empty YAML → ok:false', () => {
    const res = validateEndpointYamlText('');
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });

  it('valid YAML with orbiter provider → ok:true', () => {
    const yaml = [
      'provider:',
      '  kind: orbiter',
      '  siteId: site-123',
      '  domain: fs',
      '  buildDir: dist',
      'mappings: []',
      '',
    ].join('\n');

    const res = validateEndpointYamlText(yaml);
    expect(res.ok).to.eql(true);

    if (res.ok) {
      expect(res.doc.provider?.kind).to.eql('orbiter');
      expect(res.doc.mappings ?? []).to.eql([]);
    }
  });

  it('schema-invalid orbiter provider → ok:false', () => {
    const yaml = [
      'provider:',
      '  kind: orbiter',
      '  domain: fs',
      '  buildDir: dist',
      'mappings: []',
      '',
    ].join('\n');

    const res = validateEndpointYamlText(yaml);
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });

  it('unknown provider kind → ok:false', () => {
    const yaml = ['provider:', '  kind: wat', 'mappings: []', ''].join('\n');

    const res = validateEndpointYamlText(yaml);
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });
});
