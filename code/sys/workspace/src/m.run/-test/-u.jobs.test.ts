import { describe, expect, expectError, it } from '../../-test.ts';
import { autoJobs, resolveJobs } from '../u/u.jobs.ts';

describe('WorkspaceRun.jobs', () => {
  it('resolves explicit positive integer jobs', () => {
    expect(resolveJobs({ jobs: 3 })).to.eql(3);
  });

  it('resolves auto jobs from bounded hardware concurrency', () => {
    expect(resolveJobs({ jobs: 'auto', hardwareConcurrency: 16 })).to.eql(8);
    expect(resolveJobs({ hardwareConcurrency: 7 })).to.eql(3);
    expect(resolveJobs({ hardwareConcurrency: 2 })).to.eql(2);
    expect(resolveJobs({ hardwareConcurrency: 1 })).to.eql(2);
  });

  it('uses the unknown-hardware fallback for invalid hardware concurrency', () => {
    expect(autoJobs(0)).to.eql(4);
    expect(autoJobs(-1)).to.eql(4);
    expect(autoJobs(1.5)).to.eql(4);
  });

  it('rejects non-positive and non-integer explicit jobs', async () => {
    await expectError(() => resolveJobs({ jobs: 0 }), 'positive integer');
    await expectError(() => resolveJobs({ jobs: -1 }), 'positive integer');
    await expectError(() => resolveJobs({ jobs: 1.5 }), 'positive integer');
  });
});
