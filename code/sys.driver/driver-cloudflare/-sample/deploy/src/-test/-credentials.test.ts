import { Env } from '@sys/fs/env';
import { describe, expect, Fs, it, Str } from '../-test.ts';
import { credentialsFrom } from '../u.credentials.ts';

const names = {
  accessKeyId: 'SAMPLE_R2_TEST_ACCESS_KEY_ID',
  secretAccessKey: 'SAMPLE_R2_TEST_SECRET_ACCESS_KEY',
};
const credentials = { accessKeyId: 'fixture-access', secretAccessKey: 'fixture-secret' };

describe('R2 deployment sample: credential reader', () => {
  it('uses only the configured names from the supplied reader', () => {
    const seen: string[] = [];
    const values: Record<string, string> = {
      [names.accessKeyId]: credentials.accessKeyId,
      [names.secretAccessKey]: credentials.secretAccessKey,
    };
    const result = credentialsFrom(names, {
      get(key) {
        seen.push(key);
        return values[key];
      },
    });
    expect(result).to.eql(credentials);
    expect(seen).to.eql([names.accessKeyId, names.secretAccessKey]);
  });

  it('reports missing or empty names without disclosing the available value', () => {
    expect(() => credentialsFrom(names, { get: () => undefined })).to.throw(
      `Sample serving credentials are missing: ${names.accessKeyId}, ${names.secretAccessKey}.`,
    );
    expect(() =>
      credentialsFrom(names, {
        get: (key) => key === names.accessKeyId ? credentials.accessKeyId : '',
      })
    ).to.throw(`Sample serving credentials are missing: ${names.secretAccessKey}.`);
    expect(() =>
      credentialsFrom(names, {
        get: (key) => key === names.secretAccessKey ? credentials.secretAccessKey : '',
      })
    ).to.throw(`Sample serving credentials are missing: ${names.accessKeyId}.`);
  });

  it('consumes a real Env reader without requiring process-environment exports', async () => {
    const dir = await Fs.makeTempDir({ prefix: 'sample-r2-env-' });
    const before = [Deno.env.get(names.accessKeyId), Deno.env.get(names.secretAccessKey)];
    try {
      await Fs.write(
        dir.join('.env'),
        Str.dedent(`
        ${names.accessKeyId}=${credentials.accessKeyId}
        ${names.secretAccessKey}=${credentials.secretAccessKey}
      `),
        { throw: true },
      );
      // Isolated fixture only: ordinary tests must not search for the repository's real secrets.
      const env = await Env.load({ cwd: dir.absolute, search: 'cwd' });
      expect(credentialsFrom(names, env)).to.eql(credentials);
      expect([Deno.env.get(names.accessKeyId), Deno.env.get(names.secretAccessKey)]).to.eql(before);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
