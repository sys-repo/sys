import { describe, expect, it } from '../../-test.ts';

import { assertBuildOk } from './u.fixture.build.ts';
import { assertRunOk, commandRun, operationRun } from './u.fixture.task.ts';

describe('Vite external fixture diagnostics', () => {
  it('preserves failed task command context', () => {
    expect(() =>
      assertRunOk(
        commandRun({
          cwd: '/fixture',
          cmd: ['deno', 'task', 'build'],
          ok: false,
          code: 7,
          stdout: 'task output',
          stderr: 'task error',
        }),
        'Fixture task failed',
      )
    ).to.throw(
      'Fixture task failed (exit 7)\n' +
        'cwd: /fixture\n' +
        'cmd: deno task build\n\n' +
        'stdout:\ntask output\n\nstderr:\ntask error',
    );
  });

  it('identifies failed in-process fixture work as an operation', () => {
    expect(() =>
      assertRunOk(
        operationRun({
          cwd: '/fixture',
          operation: 'workspace patch',
          ok: false,
          code: 1,
          stdout: '',
          stderr: 'write failed',
        }),
        'Fixture operation failed',
      )
    ).to.throw(
      'Fixture operation failed (status 1)\n' +
        'cwd: /fixture\n' +
        'operation: workspace patch\n\n' +
        'stdout:\n(empty)\n\nstderr:\nwrite failed',
    );
  });

  it('preserves failed build command context', () => {
    expect(() =>
      assertBuildOk(
        {
          ok: false,
          paths: { cwd: '/fixture' },
          cmd: {
            input: 'deno run vite build',
            output: {
              code: 9,
              text: { stdout: 'build output', stderr: 'build error' },
            },
          },
        },
        'Fixture build failed',
      )
    ).to.throw(
      'Fixture build failed (exit 9)\n' +
        'cwd: /fixture\n' +
        'cmd: deno run vite build\n\n' +
        'stdout:\nbuild output\n\nstderr:\nbuild error',
    );
  });
});
