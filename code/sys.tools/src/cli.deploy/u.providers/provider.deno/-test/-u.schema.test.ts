import { describe, expect, it } from '../../../../-test.ts';
import { DenoProvider } from '../mod.ts';

describe('DenoProvider.Schema', () => {
  it('accepts the minimal deno provider config', () => {
    const res = DenoProvider.Schema.validate({ kind: 'deno', app: 'my-app' });
    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);
  });

  it('accepts the optional deno provider fields', () => {
    const res = DenoProvider.Schema.validate({
      kind: 'deno',
      app: 'my-app',
      org: 'my-org',
      tokenEnv: 'DENO_DEPLOY_TOKEN',
      verifyPreview: true,
    });
    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);
  });

  it('rejects unknown keys', () => {
    const res = DenoProvider.Schema.validate({
      kind: 'deno',
      app: 'my-app',
      extra: true,
    });
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('rejects missing app', () => {
    const res = DenoProvider.Schema.validate({
      kind: 'deno',
    });
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });
});
