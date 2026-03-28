import { c, describe, expect, it, stripAnsi } from '../../../-test.ts';
import { FmtInternal } from '../m.fmt/mod.ts';

describe('DenoDeploy.Fmt', () => {
  it('renders deploy config with a redacted token', () => {
    const text = stripAnsi(
      FmtInternal.deployConfig({
        app: 'sample',
        org: 'sys-org',
        token: 'ddotest12345',
        sourceDir: '/repo/code/projects/foo',
        stagedDir: '/tmp/stage-root',
      }).join('\n'),
    );

    expect(text).to.include('ddo..12345');
    expect(text).to.not.include('ddotest12345');
    expect(text).to.include('/repo/code/projects/foo');
    expect(text).to.include('/tmp/stage-root');
  });

  it('renders the staged deploy entrypoint summary', () => {
    const text = stripAnsi(
      FmtInternal.stagedEntrypoint({
        sourceDir: '/repo/code/projects/foo',
        stagedDir: '/tmp/stage',
        entrypoint: '/tmp/stage/entry.ts',
        entryPaths: '/tmp/stage/entry.paths.ts',
        appEntrypoint: './src/m.server/main.ts',
        workspaceTarget: './code/projects/foo',
        distDir: './code/projects/foo/dist',
        distHash: 'sha256-abc123',
      }).join('\n'),
    );

    expect(text).to.include('./src/m.server/main.ts');
    expect(text).to.include('./code/projects/foo');
    expect(text).to.include('./code/projects/foo/dist');
    expect(text).to.include('sha256-abc123');
  });

  it('renders deploy result urls', () => {
    const rendered = FmtInternal.deployResult({
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
    }, 'Deploy Result', 1500).join('\n');
    const text = stripAnsi(rendered);

    expect(text).to.include('https://console.deno.com/org/app/builds/abc');
    expect(text).to.include('https://app-abc.deno.net');
    expect(text).to.include('elapsed');
    expect(text).to.include('true (code:0)');
    expect(rendered).to.include(c.white('abc'));
  });

  it('highlights the shared deploy id across revision and preview urls', () => {
    const rendered = FmtInternal.deployResult({
        ok: true,
        code: 0,
        stdout: '',
        stderr: '',
        deploy: {
          url: {
            revision: 'https://console.deno.com/sys-org/driver-sample/builds/5s47nb0fx96c',
            preview: 'https://driver-sample-5s47nb0fx96c.sys-org.deno.net',
          },
      },
    }, 'Deploy Result', 1500).join('\n');

    expect(stripAnsi(rendered).match(/5s47nb0fx96c/g)?.length).to.eql(2);
    expect(rendered).to.include('5s47nb0fx96c');
  });

  it('renders a compact pipeline failure block', () => {
    const text = stripAnsi(
      FmtInternal.pipelineFailure({
        phase: 'prepare',
        at: '2026-03-28T12:34:56.000Z',
        error: new Error('broken deploy root'),
      }).join('\n'),
    );

    expect(text).to.include('Deploy Failed');
    expect(text).to.include('prepare');
    expect(text).to.include('2026-03-28T12:34:56.000Z');
    expect(text).to.include('broken deploy root');
  });

  it('extracts deploy diagnostics from wrangle failure output', () => {
    const text = stripAnsi(
      FmtInternal.pipelineFailure({
        phase: 'deploy',
        error: new Error(`
DenoDeploy.pipeline: deploy failed (code 1).

stdout:

stderr:
[00:00]                                                    0/2 files uploaded.
[00:00] ██████████████████████████████████████████████████ 2/2 files uploaded.

✗ An error occurred:
  An unexpected internal error occurred. If this issue persists, please contact support.
  trace id: 6ab4a481d06f2bf753adc4897c548a2f
        `),
      }).join('\n'),
    );

    expect(text).to.include('Deploy Failed');
    expect(text).to.include('deploy');
    expect(text).to.include('An unexpected internal error occurred. If this issue persists, please contact support.');
    expect(text).to.include('trace id');
    expect(text).to.include('6ab4a481d06f2bf753adc4897c548a2f');
  });
});
