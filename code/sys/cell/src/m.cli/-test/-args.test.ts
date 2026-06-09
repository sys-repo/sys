import { describe, it } from '../../-test.ts';
import { expectCliError } from './u.fixture.ts';

describe(`@sys/cell/cli args`, () => {
  it('--format is scoped to dsl only', async () => {
    await expectCliError(['--format', 'skill'], 'Unexpected option without command: --format');
    await expectCliError(['info', '--format', 'skill'], 'Unexpected option for info: --format');
    await expectCliError(['init', '--format', 'skill'], 'Unexpected option for init: --format');
    await expectCliError(
      ['migrate', '--format', 'skill'],
      'Unexpected option for migrate: --format',
    );
    await expectCliError(['task', '--format', 'skill'], 'Unexpected option for task: --format');
    await expectCliError(['start', '--format', 'skill'], 'Unexpected option for start: --format');
    await expectCliError(['kill', '--format', 'skill'], 'Unexpected option for kill: --format');
  });

  it('task → rejects invalid invocation shapes', async () => {
    await expectCliError(['task'], 'Missing task name.');
    await expectCliError(['task', '--dry-run'], 'Unexpected option for task: --dry-run');
    await expectCliError(['task', 'capture', '.', 'extra'], 'Unexpected argument: extra');
  });

  it('--plan is scoped to task only', async () => {
    await expectCliError(['--plan'], 'Unexpected option without command: --plan');
    await expectCliError(['info', '--plan'], 'Unexpected option for info: --plan');
    await expectCliError(['init', '--plan'], 'Unexpected option for init: --plan');
    await expectCliError(['migrate', '--plan'], 'Unexpected option for migrate: --plan');
    await expectCliError(['dsl', '--plan'], 'Unexpected option for dsl: --plan');
    await expectCliError(['start', '--plan'], 'Unexpected option for start: --plan');
    await expectCliError(['kill', '--plan'], 'Unexpected option for kill: --plan');
  });

  it('--mode is scoped to start and kill only', async () => {
    await expectCliError(['--mode', 'dev'], 'Unexpected option without command: --mode');
    await expectCliError(['info', '--mode', 'dev'], 'Unexpected option for info: --mode');
    await expectCliError(['init', '--mode', 'dev'], 'Unexpected option for init: --mode');
    await expectCliError(['migrate', '--mode', 'dev'], 'Unexpected option for migrate: --mode');
    await expectCliError(['dsl', '--mode', 'dev'], 'Unexpected option for dsl: --mode');
    await expectCliError(
      ['task', 'capture', '--mode', 'dev'],
      'Unexpected option for task: --mode',
    );
  });

  it('info → rejects invalid invocation shapes', async () => {
    await expectCliError(['info', '--agent'], 'Unexpected option for info: --agent');
    await expectCliError(['info', '--dry-run'], 'Unexpected option for info: --dry-run');
    await expectCliError(['info', '.', 'extra'], 'Unexpected argument: extra');
  });

  it('migrate → rejects invalid invocation shapes', async () => {
    await expectCliError(['migrate', '--agent'], 'Unexpected option for migrate: --agent');
    await expectCliError(['migrate', '.', 'extra'], 'Unexpected argument: extra');
  });

  it('--force is scoped to kill only', async () => {
    await expectCliError(['--force'], 'Unexpected option without command: --force');
    await expectCliError(['info', '--force'], 'Unexpected option for info: --force');
    await expectCliError(['init', '--force'], 'Unexpected option for init: --force');
    await expectCliError(['migrate', '--force'], 'Unexpected option for migrate: --force');
    await expectCliError(['dsl', '--force'], 'Unexpected option for dsl: --force');
    await expectCliError(['task', 'capture', '--force'], 'Unexpected option for task: --force');
    await expectCliError(['start', '--force'], 'Unexpected option for start: --force');
  });

  it('start → rejects invalid invocation shapes', async () => {
    await expectCliError(['start', '--dry-run'], 'Unexpected option for start: --dry-run');
    await expectCliError(['start', '--mode'], 'Option requires a value: --mode');
    await expectCliError(
      ['start', '--mode', 'dev', '--mode', 'prod'],
      'Repeated option for start: --mode',
    );
    await expectCliError(['start', '--mode', 'Bad'], "Invalid start mode: 'Bad'");
    await expectCliError(['start', '.', 'extra'], 'Unexpected argument: extra');
  });

  it('kill → rejects invalid invocation shapes', async () => {
    await expectCliError(['kill', '--agent'], 'Unexpected option for kill: --agent');
    await expectCliError(['kill', '--mode'], 'Option requires a value: --mode');
    await expectCliError(
      ['kill', '--mode', 'dev', '--mode', 'prod'],
      'Repeated option for kill: --mode',
    );
    await expectCliError(['kill', '--mode', 'Bad'], "Invalid kill mode: 'Bad'");
    await expectCliError(['kill', '.', 'extra'], 'Unexpected argument: extra');
  });
});
