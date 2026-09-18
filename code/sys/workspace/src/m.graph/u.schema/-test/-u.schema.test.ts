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

  it('validates optional package resolver facts in deno info output', () => {
    const json = validateInfoJson({
      packages: { '@test/root@*': '@test/root@0.0.457' },
      redirects: { 'jsr:@test/root': 'https://jsr.io/@test/root/0.0.457/src/mod.ts' },
    });

    expect(json).to.eql({
      packages: { '@test/root@*': '@test/root@0.0.457' },
      redirects: { 'jsr:@test/root': 'https://jsr.io/@test/root/0.0.457/src/mod.ts' },
    });
  });

  it('validates module error diagnostics', () => {
    const json = validateInfoJson({
      modules: [{
        specifier: 'file:///workspace/code/a/src/missing.ts',
        error: 'Module not found',
      }],
    });
    const invalid = () =>
      validateInfoJson({
        modules: [
          {
            specifier: 'file:///workspace/code/a/src/missing.ts',
            error: { message: 'Module not found' },
          },
        ],
      });

    expect(json.modules?.[0]?.error).to.eql('Module not found');
    expect(invalid).to.throw(/unsupported deno info json shape/i);
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
