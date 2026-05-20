import { c, describe, expect, it } from '../../-test.ts';
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

  it('formats line breakdown rows as dim subrows', () => {
    const text = WorkspaceInfo.fmt({
      runtime: { deno: '2.7.4', typescript: '5.9.2', v8: '14.x' },
      source: { include: ['code/**/*.{ts,tsx}'], exclude: [] },
      files: 12,
      lines: 123,
      lineBreakdown: { source: 111, unitTests: 10, uiSpecTests: 2 },
    });

    expect(text.includes(c.dim(`${' '.repeat(17)}111 source`))).to.eql(true);
    expect(text.includes(c.dim(`${' '.repeat(17)} 10 unit tests`))).to.eql(true);
    expect(text.includes(c.dim(`${' '.repeat(17)}  2 ui spec/tests`))).to.eql(true);
  });
});
