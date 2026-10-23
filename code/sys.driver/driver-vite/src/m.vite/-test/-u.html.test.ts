import { describe, expect, it, Str } from '../../-test.ts';
import { extractModulePreloadLinks } from './u.html.ts';

describe('build HTML evidence', () => {
  it('modulepreloads → independent of integrity, credentials spelling and attribute order', () => {
    const html = Str.dedent(`
      <link rel="modulepreload" crossorigin href="./pkg/a.js">
      <link rel="modulepreload" crossorigin integrity="sha256-proof" href="./pkg/b.js">
      <link href='./pkg/c.js' crossorigin="anonymous" rel="modulepreload">
      <link rel="stylesheet" href="./pkg/style.css">
      <template><link rel="modulepreload" href="./pkg/inert.js"></template>
    `);
    expect(extractModulePreloadLinks(html)).to.eql(['./pkg/a.js', './pkg/b.js', './pkg/c.js']);
  });
});
