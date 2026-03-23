import { describe, expect, it } from '../../../-test.ts';
import { Esm } from '../../mod.ts';

describe('Esm.Policy.candidates', () => {
  it('sorts, de-dupes, and marks current/latest candidates', () => {
    const selection = Esm.Policy.candidates({
      policy: { mode: 'latest' },
      subject: {
        entry: { module: Esm.parse('jsr:@sys/pkg@1.2.3'), target: ['deno.json'] },
        current: '1.2.3',
        available: ['1.2.3', '1.3.0', '1.2.4', '1.3.0'],
      },
    });

    expect(selection.current).to.eql({ version: '1.2.3', current: true });
    expect(selection.available).to.eql([
      { version: '1.3.0', latest: true },
      { version: '1.2.4' },
      { version: '1.2.3', current: true },
    ]);
  });
});
