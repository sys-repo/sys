import { describe, it, expect } from '@sys/testing/server';
import { Fs } from '@sys/fs';

describe('@sys/preset subpath surfaces', () => {
  it('core → imports', async () => {
    const m = await import('../m.core.ts');
    expect(m).to.exist;
  });

  it('testing → imports', async () => {
    const m = await import('../m.testing.ts');
    expect(m).to.exist;
  });

  it('ui → imports', async () => {
    const m = await import('../m.ui.ts');
    expect(m).to.exist;
  });

  it('build → exports DriverVite aliases', async () => {
    const path = Fs.join(import.meta.dirname ?? '.', '../m.build.ts');
    const source = (await Fs.readText(path)).data ?? '';
    expect(source.includes("export * as DriverVite from '@sys/driver-vite';")).to.eql(true);
    expect(source.includes("export * as DriverViteMain from '@sys/driver-vite/main';")).to.eql(true);
  });
});
