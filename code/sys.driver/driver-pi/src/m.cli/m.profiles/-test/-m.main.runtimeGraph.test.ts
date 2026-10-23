import { describe, EsmAssert, it } from '../../../-test.ts';

const ENTRY = new URL('../mod.ts', import.meta.url).pathname;

describe('@sys/driver-pi profile runtime graph', () => {
  it('keeps the default TUI graph outside Vite, lazy GUI, and server runtime', async () => {
    await EsmAssert.runtimeGraphBoundary({
      entry: ENTRY,
      forbiddenImports: ['@sys/driver-vite', '@sys/server'],
      forbiddenPathIncludes: [
        '/m.cli/m.profiles/u.start/',
        '\\m.cli\\m.profiles\\u.start\\',
      ],
    });
  });
});
