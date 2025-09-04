import { type t, describe, expect, it } from '../-test.ts';
import { logTemplate, makeWorkspace } from './u.ts';

describe('Template: monorepo (workspace)', () => {
  it('run', async () => {
    /**
     * Template setup:
     */
    const test = await makeWorkspace('ns', 'my-module');
    logTemplate('workspace', test.write.result);

    const ls = await test.ls();
    const includes = (endsWith: t.StringPath) => !!ls.find((p) => p.endsWith(endsWith));

    /**
     * Assertions:
     */
    expect(includes('/deno.json')).to.be.true;
    expect(includes('/-deno.json')).to.be.false; // renamed.
  });
});
