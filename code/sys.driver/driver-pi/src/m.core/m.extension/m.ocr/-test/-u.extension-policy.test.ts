import { describe, expect, it } from '../../../../-test.ts';
import { type t } from '../common.ts';
import { Ocr } from '../mod.ts';
import { ocrExecutables } from './u.fixture.generated.ts';

describe(`Pi: OCR extension / resolveExtensionPolicy`, () => {
  it('freezes read roots, protected roots, temp root, executables, and setup guidance', () => {
    const root = '/tmp/driver-pi-ocr' as t.StringDir;
    const profilePolicy = Ocr.Resolve.policy({
      pdf: { enabled: true, languages: ['eng', 'deu'], defaultLanguage: 'deu' },
    });
    const policy = Ocr.resolveExtensionPolicy({
      cwd: { invoked: root, git: root },
      read: ['./docs' as t.StringPath, '/tmp/readable-pdfs' as t.StringPath],
      policy: profilePolicy,
      executables: ocrExecutables(),
    });

    expect(policy).to.eql({
      readRoots: [root, `${root}/docs`, '/tmp/readable-pdfs'],
      protectedRoots: [
        `${root}/.git`,
        `${root}/.pi`,
        `${root}/.tmp/pi.cli`,
        `${root}/.tmp/pi.cli.pi`,
        `${root}/.log/@sys.driver-pi`,
        `${root}/.log/@sys.driver-pi.pi`,
      ],
      tmpRoot: `${root}/.pi/@sys/tmp/ocr`,
      pdf: profilePolicy.pdf,
      executables: ocrExecutables(),
      installCommand: Ocr.installCommand(),
    });
  });
});
