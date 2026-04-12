import { describe, expect, it } from '../../../-test.ts';
import { Str } from '../common.ts';
import { ProfileSchema } from '../u.schema.ts';
import { validateProfileYamlText } from '../u.validate.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/u.schema`, () => {
  it('initial → returns the minimal profile config', () => {
    expect(ProfileSchema.initial()).to.eql({
      sandbox: {
        capability: { read: [], write: [], env: {} },
        context: { include: [] },
      },
    });
  });

  it('validate → accepts the profile config shape and rejects residue fields', () => {
    expect(
      ProfileSchema.validate({
        sandbox: { capability: { read: ['./canon'] } },
      }).ok,
    ).to.eql(true);
    expect(ProfileSchema.validate({ name: 'main' }).ok).to.eql(false);
    expect(ProfileSchema.validate({ args: [], sandbox: {} }).ok).to.eql(false);
    expect(ProfileSchema.validate({ sandbox: {}, read: ['./legacy'] }).ok).to.eql(false);
  });

  it('validateProfileYamlText → parses valid YAML and reports invalid YAML', () => {
    const valid = validateProfileYamlText(
      Str.dedent(
        `
        sandbox:
          capability:
            read: []
            write: []
            env: {}
          context:
            include: []
        `,
      ).trimStart(),
    );
    expect(valid.ok).to.eql(true);

    const invalid = validateProfileYamlText('sandbox:\n  context:\n    agents: walk-up\n');
    expect(invalid.ok).to.eql(false);
  });
});
