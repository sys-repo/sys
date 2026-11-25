import { describe, expect, it } from '../../src/-test.ts';
import { devArgs } from '../task.cli.ts';

describe('@sys/cell development CLI arguments', () => {
  it('applies sample defaults without redirecting explicit commands', () => {
    const stripe = './-sample/cell.stripe';
    const deploy = './-sample/cell.deploy';
    const target = './another cell';
    const cases = [
      [['info'], ['info', stripe]],
      [['start'], ['start', stripe]],
      [['kill'], ['kill', stripe]],
      [['migrate'], ['migrate', stripe, '--dry-run']],
      [['init'], ['init', './-sample/foo', '--dry-run']],
      [['task'], ['task', 'sample:deploy', deploy, '--plan']],
      [['task', 'sample:deploy'], ['task', 'sample:deploy', deploy]],
      [['--', 'start', '--mode=dev'], ['start', '--mode=dev']],
      [['kill', '--mode', 'dev'], ['kill', '--mode', 'dev']],
      [['kill', target], ['kill', target]],
      [['start', '--help'], ['start', '--help']],
    ] as const;
    for (const [input, expected] of cases) {
      expect(devArgs(input), input.join(' ')).to.eql(expected);
    }
  });
});
