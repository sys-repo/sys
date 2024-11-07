import { Time, describe, it, expect, type t } from '../-test.ts';
import { Vitepress } from './mod.ts';

describe('Vitepress', () => {
  //
  it('TMP', async () => {
    const res = await Vitepress.dev();

    await Time.wait(2500);
    console.log('res', res);

    await res.dispose();
  });
});
