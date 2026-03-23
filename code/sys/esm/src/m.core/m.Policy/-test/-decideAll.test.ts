import { describe, expect, it } from '../../../-test.ts';
import { Esm } from '../../mod.ts';

describe('Esm.Policy.decideAll', () => {
  it('evaluates many dependencies into one result set', () => {
    const decisions = Esm.Policy.decideAll([
      {
        policy: { mode: 'latest' },
        subject: {
          entry: { module: Esm.parse('jsr:@sys/a@1.0.0'), target: ['deno.json'] },
          current: '1.0.0',
          available: ['1.1.0'],
        },
      },
      {
        policy: { mode: 'none' },
        subject: {
          entry: { module: Esm.parse('npm:rxjs@7.0.0'), target: ['deno.json'] },
          current: '7.0.0',
          available: ['7.1.0'],
        },
      },
    ]).decisions;

    expect(decisions.length).to.eql(2);
    expect(decisions[0].ok).to.eql(true);
    expect(decisions[1].ok).to.eql(false);
  });
});
