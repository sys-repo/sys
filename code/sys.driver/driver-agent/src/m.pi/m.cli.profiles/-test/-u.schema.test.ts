import { describe, expect, it } from '../../../-test.ts';
import { Str } from '../common.ts';
import { ProfileSetSchema } from '../u.schema.ts';
import { validateProfileSetYamlText } from '../u.validate.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/u.schema`, () => {
  it('initial → returns the minimal main profile config', () => {
    expect(ProfileSetSchema.initial()).to.eql({
      profiles: [{ name: 'main', args: [], read: [], env: {} }],
    });
  });

  it('validate → accepts the profile config shape and rejects residue fields', () => {
    expect(ProfileSetSchema.validate({ profiles: [{ name: 'main' }] }).ok).to.eql(true);
    expect(ProfileSetSchema.validate({ profiles: [] }).ok).to.eql(false);
    expect(ProfileSetSchema.validate({ profiles: [{ name: 'main', cwd: '.' }] }).ok).to.eql(
      false,
    );
  });

  it('validateProfileSetYamlText → parses valid YAML and reports invalid YAML', () => {
    const valid = validateProfileSetYamlText(
      Str.dedent(
        `
        profiles:
          - name: main
            args: []
            read: []
            env: {}
        `,
      ).trimStart(),
    );
    expect(valid.ok).to.eql(true);

    const invalid = validateProfileSetYamlText('profiles:\n  - args: []\n');
    expect(invalid.ok).to.eql(false);
  });
});
