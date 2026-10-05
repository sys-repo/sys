import { describe, expect, it, stripAnsi } from '../../-test/common.ts';
import { ViteLog } from '../../m.fmt/mod.ts';

function lines(text: string) {
  return stripAnsi(text).split('\n');
}

function expectBounded(text: string, width: number) {
  lines(text).forEach((line) => expect(line.length <= width).to.eql(true));
}

function expectDescriptionColumn(text: string, expected: Record<string, string>) {
  const rows = lines(text);
  const columns = Object.entries(expected).map(([cmd, token]) => {
    const row = rows.find((line) => line.includes(cmd) && line.includes(token)) ?? '';
    expect(row).to.not.eql('');
    return row.indexOf(token);
  });
  expect(new Set(columns).size).to.eql(1);
}

describe('ViteLog.Tasks output formatting', () => {
  it('renders full task invocations while they fit', () => {
    const text = ViteLog.Tasks.toString({ cmd: 'build', width: 80 });
    const output = stripAnsi(text);

    expectBounded(text, 80);
    expect(output).to.include('Usage: deno task build\n\n  deno task dev');
    expect(output).to.include('deno task build');
    expect(output).to.include('Transpile to production bundle.');
    expectDescriptionColumn(text, {
      dev: 'Run',
      build: 'Transpile',
      serve: 'Serve',
      info: 'Show',
    });
  });

  it('drops the repeated deno task prefix before clipping descriptions', () => {
    const text = ViteLog.Tasks.toString({ cmd: 'build', width: 42 });
    const output = stripAnsi(text);
    const build = lines(text).find((line) => line.includes('build') && !line.includes('Usage')) ??
      '';

    expectBounded(text, 42);
    expect(build).to.include('build');
    expect(build).to.not.include('deno task build');
    expect(output).to.include('Transpile to production bundle.');
    expectDescriptionColumn(text, {
      dev: 'Run',
      build: 'Transpile',
      serve: 'Serve',
      info: 'Show',
    });
  });

  it('keeps extended command help width-safe for info/help call sites', () => {
    const text = ViteLog.Tasks.toString({ cmd: 'info', minimal: false, width: 44 });
    const output = stripAnsi(text);

    expectBounded(text, 44);
    expect(output).to.include('clean');
    expect(output).to.include('Delete temporary files.');
    expect(output).to.include('info');
    expect(output).to.include('Show info.');
  });

  it('middle-ellipsizes descriptions after command-prefix compaction is exhausted', () => {
    const text = ViteLog.Tasks.toString({ cmd: 'build', width: 26 });
    const build = lines(text).find((line) => line.includes('build') && !line.includes('Usage')) ??
      '';

    expectBounded(text, 26);
    expect(build).to.include('build');
    expect(build).to.include('…');
    expect(build).to.include('bundle.');
  });
});
