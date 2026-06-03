import { describe, expect, it } from '../../../../-test.ts';
import { R2Provider } from '../mod.ts';
import { r2Provider } from './u.fixture.ts';

describe('R2 Provider: Schema', () => {
  describe('validate', () => {
    it('accepts a valid r2 provider', () => {
      const res = R2Provider.Schema.validate(r2Provider());

      expect(res.ok).to.eql(true);
    });

    it('rejects missing required fields', () => {
      const res = R2Provider.Schema.validate({
        kind: 'r2',
        accountId: 'account-1',
        bucket: 'deploy-bucket',
        prefix: 'deploy/site',
      });

      expect(res.ok).to.eql(false);
      if (!res.ok) expect(res.errors.length > 0).to.eql(true);
    });

    it('rejects blank required fields', () => {
      const res = R2Provider.Schema.validate({
        kind: 'r2',
        accountId: ' ',
        bucket: 'deploy-bucket',
        prefix: 'deploy/site',
        credentials: {
          accessKeyId: 'key-1',
          secretAccessKey: 'secret-1',
        },
      });

      expect(res.ok).to.eql(false);
      if (!res.ok) expect(res.errors.length > 0).to.eql(true);
    });

    it('rejects unknown properties', () => {
      const res = R2Provider.Schema.validate({
        kind: 'r2',
        accountId: 'account-1',
        bucket: 'deploy-bucket',
        prefix: 'deploy/site',
        credentials: {
          accessKeyId: 'key-1',
          secretAccessKey: 'secret-1',
        },
        endpoint: 'https://example.com',
      });

      expect(res.ok).to.eql(false);
      if (!res.ok) expect(res.errors.length > 0).to.eql(true);
    });
  });
});
