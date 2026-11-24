import { describe, expect, it, Str, stripAnsi } from '../../src/-test.ts';
import { print } from '../task.perf.ts';

describe('driver-vite performance reporting', () => {
  it('mixed sample outcomes → measured results without a legacy checkpoint verdict', () => {
    const detail = Str.dedent(`
      dev failed
      trace
    `);
    const result = {
      phase: 'phase.04/checkpoint-a',
      scenario: 'published-baseline',
      runs: 1,
      // Old artifacts may carry this field; it must not become a present-tense verdict.
      deliveryIdentityNote: 'Published-boundary build remains red for separate reasons.',
      samples: [
        { kind: 'build', posture: 'cold', index: 1, ok: true, elapsed: 12, detail: 'build ok' },
        { kind: 'dev', posture: 'cold', index: 1, ok: false, elapsed: 34, detail },
      ],
    } as const;
    const lines: string[] = [];
    print(result, '/fixture/perf.json', (line) => lines.push(line));

    const actual = stripAnsi(lines.join('\n'));
    expect(actual, actual).to.eql(Str.dedent(`
      driver-vite perf harness
       phase:    phase.04/checkpoint-a
       scenario: published-baseline
       runs:     1
       artifact: /fixture/perf.json

      build  cold  #01  ok   12ms  build ok
      dev    cold  #01  bad  34ms  dev failed
    `));
  });
});
