import { describe, expect, it, type t } from '../../-test.ts';
import { Yaml } from '../mod.ts';

const docOf = <T = Record<string, unknown>>(ast: t.YamlAst): T => {
  const res = Yaml.toJS<T>(ast);
  expect(res.ok).to.eql(true);
  return res.data as T;
};

describe('Yaml.EnvRef', () => {
  it('inspects refs without resolving or mutating the AST', () => {
    const ast = Yaml.parseAst(`
plain: value
secret: \${env:SECRET_VALUE}
`);

    const res = Yaml.EnvRef.inspectAst(ast);

    expect(res.ok).to.eql(true);
    expect(res.refs).to.eql<t.Yaml.EnvRef.Ref[]>([
      { path: ['secret'], name: 'SECRET_VALUE' },
    ]);
    expect(docOf<{ plain: string; secret: string }>(ast)).to.eql({
      plain: 'value',
      secret: '${env:SECRET_VALUE}',
    });
  });

  it('reports malformed refs during inspection without resolving values', () => {
    const ast = Yaml.parseAst('url: https://${env:HOST}/path\n');

    const res = Yaml.EnvRef.inspectAst(ast);

    expect(res.ok).to.eql(false);
    if (!res.ok) {
      expect(res.errors[0]?.message).to.eql(
        'url contains unsupported env ref syntax: https://${env:HOST}/path',
      );
    }
    expect(docOf<{ url: string }>(ast)).to.eql({ url: 'https://${env:HOST}/path' });
  });

  it('resolves whole-scalar `${env:NAME}` values with an injected resolver', () => {
    const ast = Yaml.parseAst(`
provider:
  siteId: \${env:SYS_SITE_ID}
  domain: example.com
`);

    const res = Yaml.EnvRef.resolveAst(ast, {
      get: (name) => name === 'SYS_SITE_ID' ? 'site-123' : undefined,
    });

    expect(res.ok).to.eql(true);
    expect(res.refs).to.eql<t.Yaml.EnvRef.Ref[]>([
      { path: ['provider', 'siteId'], name: 'SYS_SITE_ID' },
    ]);
    expect(docOf<{ provider: { siteId: string; domain: string } }>(ast)).to.eql({
      provider: { siteId: 'site-123', domain: 'example.com' },
    });
  });

  it('treats empty resolver values as present', () => {
    const ast = Yaml.parseAst('value: ${env:EMPTY_VALUE}\n');

    const res = Yaml.EnvRef.resolveAst(ast, { get: () => '' });

    expect(res.ok).to.eql(true);
    expect(docOf<{ value: string }>(ast)).to.eql({ value: '' });
  });

  it('rejects missing env keys without mutating the AST', () => {
    const ast = Yaml.parseAst('value: ${env:MISSING_VALUE}\n');

    const res = Yaml.EnvRef.resolveAst(ast, { get: () => undefined });

    expect(res.ok).to.eql(false);
    if (!res.ok) {
      expect(res.errors[0]?.message).to.eql('value references missing env var: MISSING_VALUE');
    }
    expect(res.refs).to.eql<t.Yaml.EnvRef.Ref[]>([{ path: ['value'], name: 'MISSING_VALUE' }]);
    expect(docOf<{ value: string }>(ast)).to.eql({ value: '${env:MISSING_VALUE}' });
  });

  it('rejects invalid env var names', () => {
    const ast = Yaml.parseAst('value: ${env:site_id}\n');

    const res = Yaml.EnvRef.resolveAst(ast, { get: () => 'ignored' });

    expect(res.ok).to.eql(false);
    if (!res.ok) {
      expect(res.errors[0]?.message).to.eql('value references invalid env var name: site_id');
    }
    expect(docOf<{ value: string }>(ast)).to.eql({ value: '${env:site_id}' });
  });

  it('rejects partial interpolation and unsupported env-ref syntax', () => {
    const ast = Yaml.parseAst('url: https://${env:HOST}/path\n');

    const res = Yaml.EnvRef.resolveAst(ast, { get: () => 'example.com' });

    expect(res.ok).to.eql(false);
    if (!res.ok) {
      expect(res.errors[0]?.message).to.eql(
        'url contains unsupported env ref syntax: https://${env:HOST}/path',
      );
    }
    expect(docOf<{ url: string }>(ast)).to.eql({ url: 'https://${env:HOST}/path' });
  });

  it('ignores non-string scalars', () => {
    const ast = Yaml.parseAst(`
count: 1
flag: true
empty:
`);

    const res = Yaml.EnvRef.resolveAst(ast, {
      get: () => {
        throw new Error('resolver should not be called');
      },
    });

    expect(res.ok).to.eql(true);
    expect(res.refs).to.eql([]);
    expect(docOf(ast)).to.eql({ count: 1, flag: true, empty: null });
  });

  it('does not resolve map keys', () => {
    const ast = Yaml.parseAst('${env:KEY}: literal\n');

    const res = Yaml.EnvRef.resolveAst(ast, { get: () => 'resolved-key' });

    expect(res.ok).to.eql(true);
    expect(res.refs).to.eql([]);
    expect(docOf(ast)).to.eql({ '${env:KEY}': 'literal' });
  });

  it('does not partially mutate the AST when any ref fails', () => {
    const ast = Yaml.parseAst(`
ok: \${env:OK_VALUE}
missing: \${env:MISSING_VALUE}
`);

    const res = Yaml.EnvRef.resolveAst(ast, {
      get: (name) => name === 'OK_VALUE' ? 'resolved' : undefined,
    });

    expect(res.ok).to.eql(false);
    expect(res.refs).to.eql<t.Yaml.EnvRef.Ref[]>([
      { path: ['ok'], name: 'OK_VALUE' },
      { path: ['missing'], name: 'MISSING_VALUE' },
    ]);
    expect(docOf<{ ok: string; missing: string }>(ast)).to.eql({
      ok: '${env:OK_VALUE}',
      missing: '${env:MISSING_VALUE}',
    });
  });

  it('returns resolver failures as YAML errors', () => {
    const ast = Yaml.parseAst('value: ${env:FAILS}\n');

    const res = Yaml.EnvRef.resolveAst(ast, {
      get: () => {
        throw new Error('boom');
      },
    });

    expect(res.ok).to.eql(false);
    if (!res.ok) {
      expect(res.errors[0]?.message).to.eql('value env var resolver failed for FAILS: boom');
    }
    expect(docOf<{ value: string }>(ast)).to.eql({ value: '${env:FAILS}' });
  });
});
