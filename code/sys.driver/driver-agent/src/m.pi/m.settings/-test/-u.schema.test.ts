import { describe, expect, it } from '../../../-test.ts';
import { PiSettingsSchema } from '../u.schema.ts';

describe(`@sys/driver-agent/pi/settings/u.schema`, () => {
  it('initial → returns wrapper-owned startup defaults', () => {
    expect(PiSettingsSchema.initial()).to.eql({
      quietStartup: true,
      collapseChangelog: true,
    });
  });

  it('validate → accepts the generated settings doc and rejects residue fields', () => {
    expect(PiSettingsSchema.validate({
      quietStartup: true,
      collapseChangelog: true,
    })).to.eql({
      ok: true,
      doc: {
        quietStartup: true,
        collapseChangelog: true,
      },
    });

    expect(PiSettingsSchema.validate({ quietStartup: true }).ok).to.eql(false);
    expect(PiSettingsSchema.validate({
      quietStartup: true,
      collapseChangelog: true,
      extra: true,
    }).ok).to.eql(false);
  });

  it('stringify → writes deterministic json with a trailing newline', () => {
    expect(PiSettingsSchema.stringify({
      quietStartup: true,
      collapseChangelog: true,
    })).to.eql('{\n  "quietStartup": true,\n  "collapseChangelog": true\n}\n');
  });
});
