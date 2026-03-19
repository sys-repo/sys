import { describe, expect, it, stripAnsi } from '../../../-test.ts';
import { FmtInternal } from '../m.fmt/mod.ts';

describe('DenoDeploy.Fmt', () => {
  it('renders deploy config with a redacted token', () => {
    const text = stripAnsi(
      FmtInternal.deployConfig({
        app: 'sample',
        org: 'sys-org',
        token: 'ddotest12345',
        staging: '/tmp/stage-root',
      }).join('\n'),
    );

    expect(text).to.include('ddo..12345');
    expect(text).to.not.include('ddotest12345');
    expect(text).to.include('/tmp/stage-root');
  });

  it('renders the staged deploy entrypoint summary', () => {
    const text = stripAnsi(
      FmtInternal.stagedEntrypoint({
        stagedDir: '/tmp/stage',
        entrypoint: '/tmp/stage/entry.ts',
        entryPaths: '/tmp/stage/entry.paths.ts',
        appEntrypoint: './src/m.server/main.ts',
        workspaceTarget: './code/projects/foo',
        distDir: './code/projects/foo/dist',
      }).join('\n'),
    );

    expect(text).to.include('./src/m.server/main.ts');
    expect(text).to.include('./code/projects/foo');
    expect(text).to.include('./code/projects/foo/dist');
  });

  it('renders deploy result urls', () => {
    const text = stripAnsi(
      FmtInternal.deployResult({
        ok: true,
        code: 0,
        stdout: '',
        stderr: '',
        deploy: {
          url: {
            revision: 'https://console.deno.com/org/app/builds/abc',
            preview: 'https://app-abc.deno.net',
          },
        },
      }, 'Deploy Result', 1500).join('\n'),
    );

    expect(text).to.include('https://console.deno.com/org/app/builds/abc');
    expect(text).to.include('https://app-abc.deno.net');
    expect(text).to.include('elapsed');
    expect(text).to.include('true (code:0)');
  });

  it('renders a compact pipeline failure block', () => {
    const text = stripAnsi(
      FmtInternal.pipelineFailure({
        phase: 'prepare',
        error: new Error('broken deploy root'),
      }).join('\n'),
    );

    expect(text).to.include('Deploy Failed');
    expect(text).to.include('prepare');
    expect(text).to.include('broken deploy root');
  });
});
