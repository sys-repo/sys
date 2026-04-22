import { describe, expect, it } from '../../-test.ts';
import { ViteConfig } from '../../mod.ts';
import { ViteStartup } from '../../m.vite.startup/mod.ts';
import { Vite } from '../mod.ts';

describe('Vite', () => {
  it('API', () => {
    expect(Vite.Config).to.equal(ViteConfig);
    expect(Vite.Startup).to.equal(ViteStartup);
  });
});
