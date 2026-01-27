import { describe, expect, it } from '../../../-test.ts';
import { Fs } from '../common.ts';
import {
  DEFAULT,
  ensureConfigDir,
  ensureDefaultConfig,
  fileLabel,
  fileOf,
  validateYaml,
} from '../u.fs.ts';

describe('YamlConfig.fs', () => {
  it('formats filenames and labels', () => {
    expect(fileOf('alpha', DEFAULT.EXT)).to.eql('alpha.yaml');
    expect(fileOf('beta.yaml', DEFAULT.EXT)).to.eql('beta.yaml');
    expect(fileLabel('/tmp/gamma.yaml', DEFAULT.EXT)).to.eql('gamma');
  });

  it('creates default config and validates', async () => {
    const dir = await Fs.makeTempDir();
    try {
      const base = await ensureConfigDir(dir.absolute, '-configs');
      const schema = {
        init: () => ({ title: 'Hello' }),
        validate: (value: unknown) => {
          const ok = typeof value === 'object' && value !== null && 'title' in value;
          return { ok, errors: ok ? [] : ['missing title'] };
        },
      };

      const path = await ensureDefaultConfig(base, schema, 'default', DEFAULT.EXT);
      const res = await validateYaml(path, schema);
      expect(res.ok).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
