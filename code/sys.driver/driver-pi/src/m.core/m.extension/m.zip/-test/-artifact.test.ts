import { Fs } from '@sys/fs';
import { admitZipArtifact, zipReadBundle } from '../-bundle/artifact.ts';
import { zipExtractBundle } from '../-bundle/artifact.extract.ts';
import { makeArtifact } from '../u/u.make.ts';
import { resolvePolicy } from '../u/u.policy.ts';
import { describe, expect, it, Json } from './common.ts';

describe('Pi: ZIP prepared artifact', () => {
  describe('literal policy injection', () => {
    it('replacement-shaped paths → preserves dollar sequences', async () => {
      const root = Fs.join(Fs.cwd(), "absent-$&-$$-$`-$'");
      const policy = await resolvePolicy({ readRoots: [root], protectedRoots: [] });
      const artifact = makeArtifact(policy);
      expect(artifact).to.include(Json.stringify(root));
      expect(artifact).not.to.include('__ZIP_READ_POLICY__');
    });

    it('marker-shaped paths → remain data, not unresolved syntax', async () => {
      const root = Fs.join(Fs.cwd(), 'absent-__ZIP_READ_POLICY__');
      const policy = await resolvePolicy({ readRoots: [root], protectedRoots: [] });
      expect(makeArtifact(policy)).to.include(Json.stringify(root));
    });
  });

  describe('entry admission', () => {
    it('read → exact field set and matching digest', () => {
      expect(admitZipArtifact({ ...zipReadBundle })).to.eql(zipReadBundle);
      expect(Object.isFrozen(zipReadBundle)).to.eql(true);
      expect(() => admitZipArtifact({ ...zipReadBundle, extra: true })).to.throw(
        'invalid field set',
      );
      expect(() => admitZipArtifact({ ...zipReadBundle, text: `${zipReadBundle.text}\n` }))
        .to.throw('digest does not match');
    });

    it('extract → cooperative opt-in, entry-specific marker, and matching digest', async () => {
      const read = await resolvePolicy({ readRoots: [], protectedRoots: [] });
      expect(() => makeArtifact(read, 'extract')).to.throw('cooperative opt-in');
      const policy = await resolvePolicy({
        enabled: true,
        extract: 'cooperative',
        readRoots: [],
        writeRoots: [],
        protectedRoots: [],
      });
      expect(makeArtifact(policy, 'extract')).not.to.include('__ZIP_EXTRACT_POLICY__');
      expect(admitZipArtifact(zipExtractBundle, 'extract')).to.eql(zipExtractBundle);
      expect(() => admitZipArtifact(zipExtractBundle, 'read')).to.throw('policy marker');
      expect(() =>
        admitZipArtifact({ ...zipExtractBundle, text: zipExtractBundle.text + '\n' }, 'extract')
      ).to.throw('digest does not match');
    });
  });
});
