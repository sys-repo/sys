import { formatBuildSelection, formatMissingCredentials, formatR2Failure } from '../u.fmt.ts';
import { c, describe, expect, Fmt, it, Obj, Str, stripAnsi, type t } from './common.ts';

const selection: t.Selection = Obj.deepFreeze({
  public: { 'dist.json': `sha256-${'1'.repeat(64)}` },
  private: { 'dist.json': `sha256-${'2'.repeat(64)}` },
  publicAssetBase: 'https://assets.example.test/ui/',
});

describe('R2 deployment sample: credential setup formatting', () => {
  it('missing names → setup instructions, semantic colors, and the exact rerun command', () => {
    const names = ['FIXTURE_PUBLIC_KEY', 'FIXTURE_PUBLIC_SECRET'];
    const actual = formatMissingCredentials('push:public', names, { width: 40 });
    expect(stripAnsi(actual)).to.eql(Str.dedent(`
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
    expect(actual).to.include(c.red('Cannot run push:public: missing credentials.'));
    for (const name of names) {
      expect(actual).to.include(`    ${c.cyan(name)}${c.magenta('=')}${c.yellow('"..."')}`);
    }
    expect(actual).to.include(c.cyan('.env'));
    const notes = [
      'See README.md for the bucket-scoped credentials required by this task.',
      'This task made no R2 requests.',
    ];
    for (const note of notes) {
      expect(actual).to.include(c.gray(c.italic(note)));
    }
    expect(actual).to.include(Fmt.hr({ width: 40, color: 'cyan' }));
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
      const actual = formatR2Failure('push:private', { operation: 'stat', status }, { width: 40 });
      expect(stripAnsi(actual)).to.eql(Str.dedent(`
        Cannot complete push:private.

        R2 stat failed: HTTP ${status}.

        Check the S3 key pair, account, and bucket permissions.

        No automatic retry or cleanup was performed.
        Earlier writes may remain.

        After resolving the R2 failure, rerun:
        ${Fmt.hr({ width: 40 })}

          deno task push:private
      `));
      expect(actual).to.include(c.red('Cannot complete push:private.'));
      expect(actual).to.include(c.gray(c.italic('Earlier writes may remain.')));
      expect(actual).to.include(c.cyan('After resolving the R2 failure, rerun:'));
      expect(actual).to.include(Fmt.hr({ width: 40, color: 'cyan' }));
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
    const actual = formatBuildSelection(selection, { width: 40 });
    expect(stripAnsi(actual)).to.eql(Str.dedent(`
      Selected dist.selection.json
      public:  ${selection.public['dist.json']}
      private: ${selection.private['dist.json']}

      Next: publish public assets, then the private shell.
      ${Fmt.hr({ width: 40 })}

        deno task push
    `));
  });

  it('explicit or terminal width → cyan instruction and canonical divider', () => {
    for (const width of [24, undefined]) {
      const actual = formatBuildSelection(selection, { width });
      expect(actual).to.include(Fmt.hr({ width, color: 'cyan' }));
      expect(actual).to.include(c.cyan('Next: publish public assets, then the private shell.'));
    }
  });
});
