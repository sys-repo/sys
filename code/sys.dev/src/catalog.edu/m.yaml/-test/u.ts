import { Try } from '../common.ts';
import { YamlPipeline } from '../mod.ts';

/**
 * Minimal typed view of the bit we need to shim for tests.
 * Keeps the cast narrow and local to this file.
 */
export type TestSlugDomain = {
  Slug?: {
    Domain?: { Registry?: { has(id: string): boolean } };
  };
};

/**
 * Test-only shim for the YAML pipeline's internal trait lookup.
 * Long-term plan: delete this shim once the pipeline accepts an explicit `registry` param.
 */
export const withPipelineRegistryShim = (fn: () => void) => {
  type TestSlugDomain = { Slug?: { Domain?: { Registry?: { has(id: string): boolean } } } };
  const P = YamlPipeline as TestSlugDomain;

  const prev = P.Slug?.Domain?.Registry;
  P.Slug ??= {};
  P.Slug.Domain ??= {};
  P.Slug.Domain.Registry = { has: (id: string) => id === 'video' || id === 'image-sequence' };

  Try.catch(fn);

  if (prev === undefined) {
    if (P.Slug?.Domain) delete P.Slug.Domain.Registry;
  } else {
    P.Slug!.Domain!.Registry = prev;
  }
};
