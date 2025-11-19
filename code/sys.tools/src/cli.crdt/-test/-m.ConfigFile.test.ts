import { beforeAll, describe, expect, it, Fs, slug } from '../../-test.ts';
import { Time, D } from '../common.ts';

import { ConfigFile } from '../m.ConfigFile.ts';

describe('ConfigFile', () => {
  const root = '.tmp/testing/m.ConfigFile';
  beforeAll(async () => void (await Fs.remove(root)));

  describe('ConfigFile.getOrCreate', () => {
    it('singleton on directory', async () => {
      const dirA = Fs.join(root, slug());
      const dirB = Fs.join(root, slug());

      const a = await ConfigFile.getOrCreate(dirA);
      const b = await ConfigFile.getOrCreate(dirB);

      const now = Time.now.timestamp;
      expect(a.current['.meta'].createdAt).to.be.within(now - 10, now + 10);
      expect(b.current['.meta'].createdAt).to.be.within(now - 10, now + 10);

      // Different instances based on directory.
      expect(a).to.not.equal(b);

      // Singleton instances.
      expect(await ConfigFile.getOrCreate(dirA)).to.equal(a);
      expect(await ConfigFile.getOrCreate(dirB)).to.equal(b);
    });
  });
});
