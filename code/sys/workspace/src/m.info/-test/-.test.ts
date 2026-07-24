import { Cli, describe, expect, it } from '../../-test.ts';
import { WorkspaceInfo } from '../mod.ts';

describe(`Workspace.Info`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/info');
    expect(m.WorkspaceInfo).to.equal(WorkspaceInfo);
    expect(WorkspaceInfo.DEFAULTS.testPathRules.length).to.eql(2);
  });

  it('formats a runtime and workspace stats block', () => {
    const text = WorkspaceInfo.fmt({
      runtime: { deno: '2.7.4', typescript: '5.9.2', v8: '14.x' },
      source: { include: ['code/**/*.{ts,tsx}'], exclude: [] },
      files: 12,
      lines: 345,
    });

    expect(text.includes('Deno')).to.eql(true);
    expect(text.includes('typescript')).to.eql(true);
    expect(text.includes('Workspace')).to.eql(true);
    expect(text.includes('code/**/*.{ts,tsx}')).to.eql(true);
    expect(text.includes('12')).to.eql(true);
    expect(text.includes('345')).to.eql(true);
    expect(text.includes('source')).to.eql(false);
    expect(text.includes('tests')).to.eql(false);
  });

  it('formats line breakdown as category → line count', () => {
    const text = Cli.stripAnsi(WorkspaceInfo.fmt({
      runtime: { deno: '2.7.4', typescript: '5.9.2', v8: '14.x' },
      source: { include: ['code/**/*.{ts,tsx}'], exclude: [] },
      files: 12,
      lines: 123,
      lineBreakdown: { source: 111, unitTests: 10, uiSpecTests: 2 },
    }));
    const rows = text
      .split('\n')
      .map((line) => line.trim().replace(/\s+/g, ' '));
    const index = rows.indexOf('lines 123');

    expect(index >= 0).to.eql(true);
    expect(rows.slice(index, index + 4)).to.eql([
      'lines 123',
      'source code 111',
      'unit test 10',
      'ui harness 2',
    ]);
  });
});
