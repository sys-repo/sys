import { describe, expect, it } from '../../../-test.ts';
import { validateInfoJson } from '../u.schema.ts';

describe('Workspace.Graph: validateInfoJson', () => {
  it('accepts the minimal deno info json shape used by workspace graph normalization', () => {
    const json = validateInfoJson({
      roots: ['file:///workspace/code/a/src/mod.ts'],
      modules: [
        {
          specifier: 'file:///workspace/code/a/src/mod.ts',
          dependencies: [
            {
              code: { specifier: 'file:///workspace/code/b/src/mod.ts' },
              type: { specifier: 'file:///workspace/code/b/src/types.ts' },
            },
          ],
          noise: true,
        },
      ],
      other: 'ignored',
    });

    expect(json).to.eql({
      roots: ['file:///workspace/code/a/src/mod.ts'],
      modules: [
        {
          specifier: 'file:///workspace/code/a/src/mod.ts',
          dependencies: [
            {
              code: { specifier: 'file:///workspace/code/b/src/mod.ts' },
              type: { specifier: 'file:///workspace/code/b/src/types.ts' },
            },
          ],
          noise: true,
        },
      ],
      other: 'ignored',
    });
  });

  it('fails loudly when the expected module list shape drifts', () => {
    const fn = () =>
      validateInfoJson({
        roots: ['file:///workspace/code/a/src/mod.ts'],
        modules: { specifier: 'file:///workspace/code/a/src/mod.ts' },
      });

    expect(fn).to.throw(/unsupported deno info json shape/i);
  });
});
