import { describe, EsmAssert, it } from '../../-test.ts';

describe('Html runtime boundaries', () => {
  it('keeps drivers, filesystem, UI, source editing and streaming out of the root graph', async () => {
    await EsmAssert.runtimeGraphBoundary({
      entry: new URL('../../mod.ts', import.meta.url).pathname,
      forbiddenPathIncludes: ['/-test', '/-scripts'],
      forbiddenImports: [
        '@sys/driver-vite',
        '@sys/fs',
        '@sys/cli',
        '@sys/ui',
        'react',
        'react-dom',
        'vite',
        'magic-string',
        'node:',
        'parse5-parser-stream',
        'parse5-sax-parser',
      ],
    });
  });

  it('keeps the public type entry free of runtime dependencies', async () => {
    await EsmAssert.runtimeGraphBoundary({
      entry: new URL('../../types.ts', import.meta.url).pathname,
      forbiddenPathIncludes: ['/pkg.ts', '/m.Is.ts', '/common'],
      forbiddenImports: ['parse5', '@sys/std', '@sys/fs', 'node:'],
    });
  });
});
