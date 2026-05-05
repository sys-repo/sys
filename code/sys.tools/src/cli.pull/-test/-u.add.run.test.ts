import { describe, expect, Fs, it } from '../../-test.ts';
import { runAdd } from '../u.add.run.ts';
import { parseArgs } from '../u.args.ts';

const CONFIG = './-config/@sys.tools.pull/components.yaml';
const DIST = 'https://example.com/ui.components/dist.json';
const LOCAL = './view/components';

describe('@sys/tools/pull add run adapter', () => {
  it('creates a missing config without requiring --non-interactive', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() =>
      runAdd(
        cwd,
        parseArgs(['add', '--config', CONFIG, '--dist', DIST, '--local', LOCAL]),
      )
    );

    expect(res.value.exit).to.eql(0);
    expect(res.output).to.contain('added bundle');
    expect(await Fs.exists(Fs.join(cwd, CONFIG))).to.eql(true);
  });

  it('rejects extra positional arguments', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => runAdd(cwd, parseArgs(['add', 'extra'])));

    expect(res.value.exit).to.eql(1);
    expect(res.output).to.contain('Unexpected argument: extra');
  });

  it('runs add through the CLI adapter without writing on --dry-run', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() =>
      runAdd(
        cwd,
        parseArgs([
          'add',
          '--dry-run',
          '--config',
          CONFIG,
          '--dist',
          DIST,
          '--local',
          LOCAL,
        ]),
      )
    );

    expect(res.value.exit).to.eql(0);
    expect(res.output).to.contain('would add bundle');
    expect(await Fs.exists(Fs.join(cwd, CONFIG))).to.eql(false);
  });
});

async function tempRoot() {
  return (await Fs.makeTempDir({ prefix: 'sys.tools.pull.add.run.' })).absolute;
}

async function captureInfo<T>(fn: () => Promise<T>) {
  const prev = console.info;
  const lines: string[] = [];
  console.info = (...args: unknown[]) => void lines.push(args.map(String).join(' '));
  try {
    const value = await fn();
    return { value, output: lines.join('\n') };
  } finally {
    console.info = prev;
  }
}
