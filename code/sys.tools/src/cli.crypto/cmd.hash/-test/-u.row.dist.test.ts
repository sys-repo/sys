import { describe, expect, it } from '../../../-test.ts';
import { HashRowDist } from '../mod.ts';

describe('cli.crypto/cmd.hash/u.row.dist', () => {
  const digest = 'sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const other = 'sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

  it('hides dist row when missing and not saving', () => {
    const res = HashRowDist.afterRun({
      before: { path: '/x/dist.json', exists: false, kind: 'missing' },
      saveDist: false,
      digest,
    });
    expect(res).to.eql(undefined);
  });

  it('marks created when saving and dist.json was missing', () => {
    const res = HashRowDist.afterRun({
      before: { path: '/x/dist.json', exists: false, kind: 'missing' },
      saveDist: true,
      digest,
    });
    expect(res).to.eql({ path: '/x/dist.json', status: 'created' });
  });

  it('marks differs when canonical dist exists and digest differs without save', () => {
    const res = HashRowDist.afterRun({
      before: { path: '/x/dist.json', exists: true, kind: 'canonical', digest: other },
      saveDist: false,
      digest,
    });
    expect(res).to.eql({ path: '/x/dist.json', status: 'differs' });
  });

  it('marks invalid when non-canonical dist exists without save', () => {
    const res = HashRowDist.afterRun({
      before: { path: '/x/dist.json', exists: true, kind: 'legacy' },
      saveDist: false,
      digest,
    });
    expect(res).to.eql({ path: '/x/dist.json', status: 'invalid' });
  });

  it('marks changed when saving over invalid dist', () => {
    const res = HashRowDist.afterRun({
      before: { path: '/x/dist.json', exists: true, kind: 'invalid' },
      saveDist: true,
      digest,
    });
    expect(res).to.eql({ path: '/x/dist.json', status: 'changed' });
  });

  it('shows plain dist row when canonical digest matches', () => {
    const res = HashRowDist.afterRun({
      before: { path: '/x/dist.json', exists: true, kind: 'canonical', digest },
      saveDist: false,
      digest,
    });
    expect(res).to.eql({ path: '/x/dist.json' });
  });
});
