import { describe, expect, it } from '../-test.ts';
import { Vite, ViteProcess } from '../mod.ts';

describe('Vite', () => {
  it('API', () => {
    expect(Vite.Process).to.equal(ViteProcess);
  });
});
