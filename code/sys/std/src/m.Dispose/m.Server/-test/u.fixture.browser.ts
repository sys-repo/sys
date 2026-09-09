/**
 * Browser-graph proof entry. From the @sys/std package root:
 * deno bundle --frozen --platform=browser --minify src/m.Dispose/m.Server/-test/u.fixture.browser.ts
 *
 * Browser resolution must succeed without externalizing node:util. Export the complete universal
 * namespaces so tree shaking cannot hide an accidentally exposed server surface.
 */
import { Dispose } from '@sys/std/dispose';
import { Rx } from '@sys/std/rx';

export { Dispose, Rx };
