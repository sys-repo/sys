import { formatBuildSelection, formatMissingCredentials, formatR2Failure } from '../u.fmt.ts';
import { describe, expect, Fmt, Fs, it, Obj, ROOT, Str, stripAnsi, type t } from './common.ts';

const selection: t.DistPins<t.Audience> = Obj.deepFreeze({
  pins: {
    public: { 'dist.json': `sha256-${'1'.repeat(64)}` },
    private: { 'dist.json': `sha256-${'2'.repeat(64)}` },
  },
});

describe('R2 deployment sample: credential setup formatting', () => {
  it('missing names → setup instructions and the exact rerun command', () => {
    const names = ['FIXTURE_PUBLIC_KEY', 'FIXTURE_PUBLIC_SECRET'];
    const actual = stripAnsi(formatMissingCredentials('push:public', names, { width: 40 }));
    expect(actual).to.eql(Str.dedent(`
      Cannot run push:public: missing credentials.

      Missing or empty environment variables:

          FIXTURE_PUBLIC_KEY="..."
          FIXTURE_PUBLIC_SECRET="..."

      Set non-empty values in the repository-root .env or export them in your shell.
      Active .env entries override exported values.

      See README.md for the bucket-scoped credentials required by this task.
      This task made no R2 requests.

      After configuring credentials, rerun:
      ${Fmt.hr({ width: 40 })}

        deno task push:public
    `));
  });

  it('task selection → matching blocked heading and rerun command', () => {
    const tasks: t.CredentialTask[] = ['push:private', 'serve', 'proof:local'];
    for (const task of tasks) {
      const text = stripAnsi(formatMissingCredentials(task, ['FIXTURE_READ_KEY']));
      expect(text).to.include(`Cannot run ${task}: missing credentials.`);
      expect(text.endsWith(`  deno task ${task}`)).to.eql(true);
    }
  });
});

describe('R2 deployment sample: R2 failure formatting', () => {
  for (const status of [401, 403]) {
    it(`HTTP ${status} → concise credential guidance and the selected task's rerun command`, () => {
      const detail = { operation: 'stat', status } as const;
      const actual = stripAnsi(formatR2Failure('push:private', detail, { width: 40 }));
      expect(actual).to.eql(Str.dedent(`
        Cannot complete push:private.

        R2 stat failed: HTTP ${status}.

        Check the S3 key pair, account, and bucket permissions.

        No automatic retry or cleanup was performed.
        Earlier writes may remain.

        After resolving the R2 failure, rerun:
        ${Fmt.hr({ width: 40 })}

          deno task push:private
      `));
    });
  }

  it('service failure → retain the safe code without claiming credentials are wrong', () => {
    const detail = { operation: 'list', status: 503, code: 'ServiceUnavailable' } as const;
    const actual = stripAnsi(formatR2Failure('push:public', detail));
    expect(actual).to.include('R2 list failed: HTTP 503, ServiceUnavailable.');
    expect(actual).to.include('Check the R2 service and target configuration.');
    expect(actual).not.to.include('Check the S3 key pair');
    expect(actual).not.to.include('This task made no R2 requests.');
    expect(actual.endsWith('  deno task push:public')).to.eql(true);
  });
});

describe('R2 deployment sample: build handoff formatting', () => {
  it('selected pins → aligned full checksums and one combined publication command', () => {
    const actual = stripAnsi(formatBuildSelection(selection, { width: 40 }));
    expect(actual).to.eql(Str.dedent(`
      Manifest   dist.pins.json
        public:  ${selection.pins.public['dist.json']}
        private: ${selection.pins.private['dist.json']}

      Next: publish to R2
      ${Fmt.hr({ width: 40 })}

          deno task push
    `));
  });

  it('manifest filename → link to the sample build record', () => {
    const actual = formatBuildSelection(selection, { width: 40 });
    const target = Fs.Path.toFileUrl(Fs.join(ROOT, 'dist.pins.json'));
    const heading = actual.split('\n')[0];
    expect(heading).to.include(target.href);
    expect(stripAnsi(heading)).to.eql('Manifest   dist.pins.json');
  });

  it('explicit or terminal width → matching divider', () => {
    for (const width of [24, undefined]) {
      const actual = stripAnsi(formatBuildSelection(selection, { width }));
      expect(actual.split('\n')).to.include(Fmt.hr({ width }));
    }
  });
});
