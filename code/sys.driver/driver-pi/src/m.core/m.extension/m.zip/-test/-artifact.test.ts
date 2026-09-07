import { Fs } from '@sys/fs';
import { describe, expect, it } from '../../../../-test.ts';
import { Json } from '../-bundle/common.ts';
import { admitZipReadArtifact, zipReadBundle } from '../-bundle/artifact.ts';
import { makeArtifact } from '../u/u.make.ts';
import { resolvePolicy } from '../u/u.policy.ts';

describe('Pi: ZIP prepared artifact', () => {
  it('injects policy literally', async () => {
    const root = Fs.join(Fs.cwd(), "absent-$&-$$-$`-$'");
    const policy = await resolvePolicy({ readRoots: [root], protectedRoots: [] });
    const artifact = makeArtifact(policy);
    expect(artifact).to.include(Json.stringify(root));
    expect(artifact).not.to.include('__ZIP_READ_POLICY__');
  });

  it('injects marker-shaped policy data without mistaking it for unresolved syntax', async () => {
    const root = Fs.join(Fs.cwd(), 'absent-__ZIP_READ_POLICY__');
    const policy = await resolvePolicy({ readRoots: [root], protectedRoots: [] });
    expect(makeArtifact(policy)).to.include(Json.stringify(root));
  });

  it('admits only the prepared text and its matching digest', () => {
    expect(admitZipReadArtifact({ ...zipReadBundle })).to.eql(zipReadBundle);
    expect(Object.isFrozen(zipReadBundle)).to.eql(true);
    expect(() => admitZipReadArtifact({ ...zipReadBundle, extra: true })).to.throw(
      'invalid field set',
    );
    expect(() => admitZipReadArtifact({ ...zipReadBundle, text: `${zipReadBundle.text}\n` }))
      .to.throw('digest does not match');
  });
});
