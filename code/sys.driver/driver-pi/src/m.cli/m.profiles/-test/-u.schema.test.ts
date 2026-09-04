import { describe, expect, it } from '../../../-test.ts';
import { Str } from '../common.ts';
import { ProfileSchema } from '../u.schema/mod.ts';
import { validateProfileYamlText } from '../u/u.validate.ts';

describe(`@sys/driver-pi/cli/Profiles/u.schema`, () => {
  it('initial → returns the minimal profile config', () => {
    expect(ProfileSchema.initial()).to.eql({
      sandbox: {
        capability: { read: [], write: [], env: {} },
        context: { append: [] },
      },
      tools: {
        remove: { enabled: true, recursive: true },
        move: { enabled: true },
        copy: { enabled: true },
        ocr: {
          pdf: {
            enabled: false,
            languages: ['eng'],
            defaultLanguage: 'eng',
            dpi: 200,
            maxPages: 10,
            maxChars: 60_000,
            timeoutMs: 120_000,
          },
        },
      },
    });
  });

  it('validate → accepts the profile config shape and rejects residue fields', () => {
    expect(
      ProfileSchema.validate({
        prompt: { system: 'You are focused.' },
        sandbox: { capability: { read: ['./canon'] } },
        tools: {
          remove: { enabled: true, recursive: false },
          move: { enabled: true },
          copy: { enabled: true },
          ocr: {
            pdf: {
              enabled: true,
              languages: ['eng', 'deu'],
              defaultLanguage: 'eng',
              dpi: 200,
              maxPages: 10,
              maxChars: 60_000,
              timeoutMs: 120_000,
            },
          },
        },
      }).ok,
    ).to.eql(true);
    expect(ProfileSchema.validate({ tools: { remove: {}, move: {}, copy: {}, ocr: {} } }).ok)
      .to.eql(true);
    expect(ProfileSchema.validate({ tools: { ocr: { pdf: {} } } }).ok).to.eql(true);
    expect(ProfileSchema.validate({ prompt: { system: '' } }).ok).to.eql(false);
    expect(ProfileSchema.validate({ name: 'main' }).ok).to.eql(false);
    expect(ProfileSchema.validate({ args: [], sandbox: {} }).ok).to.eql(false);
    expect(ProfileSchema.validate({ sandbox: {}, read: ['./legacy'] }).ok).to.eql(false);
    expect(ProfileSchema.validate({ tools: { delete: { enabled: true } } }).ok).to.eql(false);
    expect(ProfileSchema.validate({ tools: { remove: { force: true } } }).ok).to.eql(false);
    expect(ProfileSchema.validate({ tools: { move: { force: true } } }).ok).to.eql(false);
    expect(ProfileSchema.validate({ tools: { copy: { recursive: true } } }).ok).to.eql(false);
    expect(ProfileSchema.validate({ tools: { ocr: { image: { enabled: true } } } }).ok)
      .to.eql(false);
    expect(ProfileSchema.validate({ tools: { ocr: { pdf: { dpi: 71 } } } }).ok).to.eql(false);
    expect(ProfileSchema.validate({ tools: { ocr: { pdf: { dpi: 601 } } } }).ok).to.eql(false);
    expect(ProfileSchema.validate({ tools: { ocr: { pdf: { maxPages: 1.5 } } } }).ok)
      .to.eql(false);
    expect(ProfileSchema.validate({ tools: { ocr: { pdf: { maxPages: 101 } } } }).ok)
      .to.eql(false);
    expect(ProfileSchema.validate({ tools: { ocr: { pdf: { maxChars: 1_000_001 } } } }).ok)
      .to.eql(false);
    expect(ProfileSchema.validate({ tools: { ocr: { pdf: { timeoutMs: 999 } } } }).ok)
      .to.eql(false);
    expect(ProfileSchema.validate({ tools: { ocr: { pdf: { timeoutMs: 600_001 } } } }).ok)
      .to.eql(false);
    expect(ProfileSchema.validate({ tools: { ocr: { pdf: { languages: [] } } } }).ok)
      .to.eql(false);
    expect(ProfileSchema.validate({ tools: { ocr: { pdf: { defaultLanguage: '' } } } }).ok)
      .to.eql(false);
    expect(ProfileSchema.validate({ tools: { ocr: { pdf: { executable: '/usr/bin/tesseract' } } } }).ok)
      .to.eql(false);
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
