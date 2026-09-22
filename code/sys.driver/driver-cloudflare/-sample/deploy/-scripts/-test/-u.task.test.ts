import { WebFixture } from '@sys/testing/web';
import { appFrom } from '../../src/entry.ts';
import { fixtureInputs } from '../../src/-test/u.config.ts';
import { missingCredentialsError } from '../../src/m.app/u.credentials.ts';
import { formatMissingCredentials, formatR2Failure } from '../u.fmt.ts';
import { prove } from '../u.proof.ts';
import { r2Failure, runTask } from '../u.task.ts';
import { describe, expect, expectError, it } from './common.ts';
import { localFixture } from './u.fixture.ts';

describe('R2 deployment sample: task outcomes', () => {
  it('setup failure → one explanation, return code 1, no retry, and a trailing blank line', async () => {
    const logs: string[] = [];
    const names = ['FIXTURE_MISSING_KEY'];
    let calls = 0;
    const run = () => {
      calls++;
      return Promise.reject(missingCredentialsError(names));
    };
    const code = await runTask('push:private', run, (text) => logs.push(text));
    expect(code).to.eql(1);
    expect(calls).to.eql(1);
    // Presentation belongs to the formatter; the runner adds the prompt-separating newline.
    expect(logs).to.eql([`${formatMissingCredentials('push:private', names)}\n`]);
  });

  it('recognized R2 refusal → captured safe output, return code 1, and no retry', async () => {
    const detail = { operation: 'stat' as const, status: 401 };
    const error = r2Failure(detail);
    detail.status = 503;
    error.message = 'private mutated message';
    const logs: string[] = [];
    let calls = 0;
    const code = await runTask('push:private', () => {
      calls++;
      return Promise.reject(error);
    }, (text) => logs.push(text));
    expect(code).to.eql(1);
    expect(calls).to.eql(1);
    expect(logs).to.eql([
      `${formatR2Failure('push:private', { operation: 'stat', status: 401 })}\n`,
    ]);
  });

  it('reporting failure → original reporter error escapes without another report', async () => {
    const failure = r2Failure({ operation: 'stat', status: 403 });
    const reporterError = new Error('fixture reporter failure');
    let reports = 0;
    const error = await expectError(() =>
      runTask('push:private', () => Promise.reject(failure), () => {
        reports++;
        throw reporterError;
      })
    );
    expect(error).to.equal(reporterError);
    expect(reports).to.eql(1);
  });

  it('success → return code 0 without setup output', async () => {
    const logs: string[] = [];
    const code = await runTask('serve', () => Promise.resolve(), (text) => logs.push(text));
    expect(code).to.eql(0);
    expect(logs).to.eql([]);
  });

  it('unrelated error or permission denial → original error escapes without setup advice', async () => {
    const errors = [
      new Error('unexpected'),
      new Error('R2 stat failed: HTTP 401.'),
      new Deno.errors.NotCapable('fixture denial'),
    ];
    for (const error of errors) {
      const logs: string[] = [];
      const run = () => Promise.reject(error);
      const actual = await expectError(() => runTask('serve', run, (text) => logs.push(text)));
      expect(actual).to.equal(error);
      expect(logs).to.eql([]);
    }
  });
});

describe('R2 deployment sample: private-read setup', () => {
  for (const task of ['serve', 'proof:local'] as const) {
    it(`${task} caller → missing read credentials stop bootstrap before network access`, async () => {
      await using f = task === 'proof:local' ? await localFixture() : undefined;
      const inputs = f ?? fixtureInputs();
      const seen: string[] = [];
      const env = {
        get(name: string) {
          seen.push(name);
          return ' ';
        },
      };
      const requests: Request[] = [];
      using _transport = WebFixture.Fetch.mock((input, init) => {
        requests.push(new Request(input, init));
        return Promise.reject(new Error('Setup failure must not reach the network.'));
      });
      const start = () => {
        throw new Error('Setup failure must not start a listener.');
      };
      const run = f
        ? () => prove({ root: f.dir.absolute, env, log: () => {}, start })
        : () => appFrom(inputs, env);
      const logs: string[] = [];
      expect(await runTask(task, run, (text) => logs.push(text))).to.eql(1);
      const names = inputs.config.credentials.serve;
      expect(seen).to.eql([names.accessKeyId, names.secretAccessKey]);
      expect(requests).to.eql([]);
      expect(logs).to.eql([
        `${formatMissingCredentials(task, [names.accessKeyId, names.secretAccessKey])}\n`,
      ]);
    });
  }
});
