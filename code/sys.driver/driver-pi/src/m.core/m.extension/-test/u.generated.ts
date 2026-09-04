import { expect } from '../../../-test.ts';

const EXTERNAL_FROM_IMPORT = /\bfrom\s+['"](?!\.{1,2}\/)[^'"]+['"]/;
const EXTERNAL_SIDE_EFFECT_IMPORT = /\bimport\s+['"](?!\.{1,2}\/)[^'"]+['"]/;

/** Assert generated Pi extension files are standalone and do not import host packages. */
export function expectStandaloneGeneratedExtension(text: string) {
  expect(text).not.to.match(EXTERNAL_FROM_IMPORT);
  expect(text).not.to.match(EXTERNAL_SIDE_EFFECT_IMPORT);
}
