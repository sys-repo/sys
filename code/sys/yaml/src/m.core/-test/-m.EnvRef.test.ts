import { describe, expect, it, Str, type t } from '../../-test.ts';
import { Yaml } from '../mod.ts';

describe('Yaml.EnvRef', () => {
  describe('reference syntax', () => {
    it('inspection → names and paths without resolving or mutating values', () => {
      const ast = Yaml.parseAst(Str.dedent(`
        plain: value
        secret: \${env:SECRET_VALUE}
      `));
      const result = Yaml.EnvRef.inspectAst(ast);
      expect(result).to.deep.include({
        ok: true,
        refs: [{ path: ['secret'], name: 'SECRET_VALUE' }],
      });
      expect(docOf(ast)).to.eql({ plain: 'value', secret: '${env:SECRET_VALUE}' });
    });

    const invalid = [
      { value: '${env:site_id}', error: 'value references invalid env var name: site_id' },
      {
        value: 'https://${env:HOST}/path',
        error: 'value contains unsupported env ref syntax: https://${env:HOST}/path',
      },
    ];
    for (const { value, error } of invalid) {
      it(`${value} → inspection and resolution refuse before consulting the resolver`, () => {
        const ast = Yaml.parseAst(`value: ${value}`);
        let calls = 0;
        const options = {
          get() {
            calls++;
            return 'must not resolve';
          },
        };
        for (const result of [Yaml.EnvRef.inspectAst(ast), Yaml.EnvRef.resolveAst(ast, options)]) {
          expect(result.ok).to.eql(false);
          if (!result.ok) expect(result.errors[0]?.message).to.eql(error);
          expect(result).not.to.have.property('unavailable');
        }
        expect(calls).to.eql(0);
        expect(docOf(ast)).to.eql({ value });
      });
    }

    it('non-string scalars and map keys → literal data, not resolver input', () => {
      const ast = Yaml.parseAst(Str.dedent(`
        count: 1
        flag: true
        empty:
        \${env:KEY}: literal
      `));
      const result = Yaml.EnvRef.resolveAst(ast, {
        get() {
          throw new Error('Literal data must not consult the resolver.');
        },
      });
      expect(result).to.deep.include({ ok: true, refs: [] });
      expect(docOf(ast)).to.eql({ count: 1, flag: true, empty: null, '${env:KEY}': 'literal' });
    });
  });

  describe('value policy', () => {
    it('whole-scalar reference → resolved value beside unchanged literal data', () => {
      const ast = Yaml.parseAst(Str.dedent(`
        provider:
          siteId: \${env:SYS_SITE_ID}
          domain: example.com
      `));
      const result = Yaml.EnvRef.resolveAst(ast, {
        get: (name) => name === 'SYS_SITE_ID' ? 'site-123' : undefined,
      });
      expect(result).to.deep.include({
        ok: true,
        refs: [{ path: ['provider', 'siteId'], name: 'SYS_SITE_ID' }],
      });
      expect(docOf(ast)).to.eql({ provider: { siteId: 'site-123', domain: 'example.com' } });
    });

    it('default policy → an empty string is accepted', () => {
      const ast = Yaml.parseAst('value: ${env:EMPTY_VALUE}');
      const result = Yaml.EnvRef.resolveAst(ast, { get: () => '' });
      expect(result.ok).to.eql(true);
      expect(docOf(ast)).to.eql({ value: '' });
    });

    it('nonEmpty policy → accepted values retain their exact whitespace', () => {
      const value = '  preserved-value\t';
      const ast = Yaml.parseAst('value: ${env:PRESENT_VALUE}');
      const result = Yaml.EnvRef.resolveAst(ast, { get: () => value, nonEmpty: true });
      expect(result.ok).to.eql(true);
      expect(docOf(ast)).to.eql({ value });
    });

    const unavailable = [
      { name: 'missing', value: undefined, message: 'missing' },
      { name: 'empty', value: '', message: 'empty' },
      { name: 'whitespace-only', value: ' \t ', message: 'empty' },
    ];
    for (const { name, value, message } of unavailable) {
      it(`${name} under nonEmpty → unavailable reference metadata and unchanged AST`, () => {
        const ast = Yaml.parseAst('value: ${env:REQUIRED_VALUE}');
        const result = Yaml.EnvRef.resolveAst(ast, { get: () => value, nonEmpty: true });
        expect(result).to.deep.include({
          ok: false,
          unavailable: [{ path: ['value'], name: 'REQUIRED_VALUE' }],
        });
        if (!result.ok) {
          expect(result.errors[0]?.message).to.eql(
            `value references ${message} env var: REQUIRED_VALUE`,
          );
        }
        expect(docOf(ast)).to.eql({ value: '${env:REQUIRED_VALUE}' });
      });
    }
  });

  describe('all-or-nothing resolution', () => {
    it('a missing reference → no partial substitution of otherwise valid values', () => {
      const ast = Yaml.parseAst(Str.dedent(`
        ok: \${env:OK_VALUE}
        missing: \${env:MISSING_VALUE}
      `));
      const result = Yaml.EnvRef.resolveAst(ast, {
        get: (name) => name === 'OK_VALUE' ? 'resolved' : undefined,
      });
      expect(result).to.deep.include({
        ok: false,
        refs: [
          { path: ['ok'], name: 'OK_VALUE' },
          { path: ['missing'], name: 'MISSING_VALUE' },
        ],
        unavailable: [{ path: ['missing'], name: 'MISSING_VALUE' }],
      });
      expect(docOf(ast)).to.eql({ ok: '${env:OK_VALUE}', missing: '${env:MISSING_VALUE}' });
    });

    it('missing plus resolver failure → unavailable metadata omitted; AST unchanged', () => {
      const ast = Yaml.parseAst(Str.dedent(`
        ok: \${env:OK_VALUE}
        missing: \${env:MISSING}
        failed: \${env:FAILS}
      `));
      const result = Yaml.EnvRef.resolveAst(ast, {
        get(name) {
          if (name === 'OK_VALUE') return 'resolved';
          if (name === 'MISSING') return undefined;
          throw new Error('resolver failed');
        },
      });
      expect(result.ok).to.eql(false);
      expect(result).not.to.have.property('unavailable');
      expect(docOf(ast)).to.eql({
        ok: '${env:OK_VALUE}',
        missing: '${env:MISSING}',
        failed: '${env:FAILS}',
      });
    });

    it('resolver exception → YAML diagnostic, not unavailable-value metadata', () => {
      const ast = Yaml.parseAst('value: ${env:FAILS}');
      const result = Yaml.EnvRef.resolveAst(ast, {
        get() {
          throw new Error('boom');
        },
      });
      expect(result.ok).to.eql(false);
      if (!result.ok) {
        expect(result.errors[0]?.message).to.eql('value env var resolver failed for FAILS: boom');
      }
      expect(result).not.to.have.property('unavailable');
      expect(docOf(ast)).to.eql({ value: '${env:FAILS}' });
    });
  });
});

function docOf(ast: t.YamlAst) {
  const result = Yaml.toJS(ast);
  expect(result.ok).to.eql(true);
  return result.data;
}
