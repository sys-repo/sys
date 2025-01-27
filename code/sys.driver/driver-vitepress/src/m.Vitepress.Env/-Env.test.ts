import { describe, expect, it } from '../-test.ts';
import { VitePress } from '../mod.ts';
import { VitepressEnv } from './mod.ts';

describe('Vitepress.Env', () => {
  it('API', () => {
    expect(VitePress.Env).to.equal(VitepressEnv);
  });
});
