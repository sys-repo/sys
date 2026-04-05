import { Fs } from '@sys/fs';
import { describe, expect, it } from '../../src/-test.ts';
import { run } from '../task.sample.create.ts';

describe('task.sample.create', () => {
  it('writes the sample profile yaml into the stage config dir', async () => {
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const result = await run({ cwd });
      const read = await Fs.readText(result.path);
      const yaml = String(read.data ?? '');

      expect(result.kind).to.eql('created');
      expect(result.path).to.eql(Fs.join(cwd, '-config/@tdb.slc-data/stage/sample-1.yaml'));
      expect(yaml.includes('source: ./src/-test/sample-1')).to.eql(true);
      expect(yaml.includes('mount: sample-1')).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
