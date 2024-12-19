import { describe, it } from '../-test.ts';
import { FileMap } from './mod.ts';

describe('FileMap', () => {
  const SAMPLE_DIR = './src/m.FileMap/-sample';

  describe('FileMap.bundle', () => {
    it('bundle', async () => {
      const res = await FileMap.bundle(SAMPLE_DIR);

      console.log(`-------------------------------------------`);
      console.log('FileMap.bundle:', res);
    });
  });
});
