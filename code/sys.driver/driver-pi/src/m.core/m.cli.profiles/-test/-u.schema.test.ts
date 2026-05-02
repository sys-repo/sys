import { describe, expect, it } from '../../../-test.ts';
import { Str } from '../common.ts';
import { ProfileSchema } from '../u.schema.ts';
import { validateProfileYamlText } from '../u.validate.ts';

describe(`@sys/driver-pi/cli/Profiles/u.schema`, () => {
  it('initial → returns the minimal profile config', () => {
    expect(ProfileSchema.initial()).to.eql({
      prompt: { system: null },
      sandbox: {
        capability: { read: [], write: [], env: {} },
        context: { append: [] },
      },
    });
  });

  it('validate → accepts the profile config shape and rejects residue fields', () => {
    expect(
      ProfileSchema.validate({
        prompt: { system: 'You are focused.' },
        sandbox: { capability: { read: ['./canon'] } },
      }).ok,
    ).to.eql(true);
    expect(ProfileSchema.validate({ prompt: { system: '' } }).ok).to.eql(false);
    expect(ProfileSchema.validate({ name: 'main' }).ok).to.eql(false);
    expect(ProfileSchema.validate({ args: [], sandbox: {} }).ok).to.eql(false);
    expect(ProfileSchema.validate({ sandbox: {}, read: ['./legacy'] }).ok).to.eql(false);
  });

  it('validateProfileYamlText → parses valid YAML and reports invalid YAML', () => {
    const valid = validateProfileYamlText(
      Str.dedent(
        `
        prompt:
          system: null
        sandbox:
          capability:
            read: []
            write: []
            env: {}
          context:
            append: []
        `,
      ).trimStart(),
    );
    expect(valid.ok).to.eql(true);

    const invalid = validateProfileYamlText('sandbox:\n  context:\n    include: [./legacy]\n');
    expect(invalid.ok).to.eql(false);
  });
});
