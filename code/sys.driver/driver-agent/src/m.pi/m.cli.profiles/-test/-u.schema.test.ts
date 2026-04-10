import { describe, expect, it } from '../../../-test.ts';
import { Str } from '../common.ts';
import { ProfileSchema } from '../u.schema.ts';
import { validateProfileYamlText } from '../u.validate.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/u.schema`, () => {
  it('initial → returns the minimal profile config', () => {
    expect(ProfileSchema.initial()).to.eql({ args: [], read: [], env: {} });
  });

  it('validate → accepts the profile config shape and rejects residue fields', () => {
    expect(ProfileSchema.validate({ args: ['--model', 'gpt-5.4'] }).ok).to.eql(true);
    expect(ProfileSchema.validate({ name: 'main' }).ok).to.eql(false);
    expect(ProfileSchema.validate({ args: [], cwd: '.' }).ok).to.eql(false);
  });

  it('validateProfileYamlText → parses valid YAML and reports invalid YAML', () => {
    const valid = validateProfileYamlText(
      Str.dedent(
        `
        args: []
        read: []
        env: {}
        `,
      ).trimStart(),
    );
    expect(valid.ok).to.eql(true);

    const invalid = validateProfileYamlText('args: [1]\n');
    expect(invalid.ok).to.eql(false);
  });
});
