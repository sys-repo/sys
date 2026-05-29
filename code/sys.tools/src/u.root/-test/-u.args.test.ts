import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { parseArgs, toRootDispatchArgv } from '../u.args.ts';

describe('Root Args', () => {
  it('parses -h alias as help=true (no command)', () => {
    const res = parseArgs(['-h']);
    expect(res.help).eql(true);
    expect(res.command).eql(undefined);
    expect(res._).eql([]);
  });

  it('extracts command from first positional when valid', () => {
    const res = parseArgs(['serve', 'x', 'y']);
    expect(res.command).eql('serve');
    expect(res._).eql(['serve', 'x', 'y']);

    if (res.command) {
      expectTypeOf(res.command).toEqualTypeOf<t.Root.Command>();
    }
  });

  it('keeps pi as the canonical root command and normalizes aliases', () => {
    const primary = parseArgs(['pi', 'x']);
    expect(primary.command).eql('pi');
    expect(primary._).eql(['pi', 'x']);

    const agent = parseArgs(['agent', 'x']);
    expect(agent.command).eql('pi');
    expect(agent._).eql(['pi', 'x']);

    const harness = parseArgs(['harness', 'x']);
    expect(harness.command).eql('pi');
    expect(harness._).eql(['pi', 'x']);
  });

  it('recognizes shell as a root command without aliases', () => {
    const res = parseArgs(['shell', 'doctor']);
    expect(res.command).eql('shell');
    expect(res._).eql(['shell', 'doctor']);
    expect(toRootDispatchArgv(['shell', 'doctor'], res)).eql(['shell', 'doctor']);
  });

  it('recognizes dsl as a root command under more tools', () => {
    const res = parseArgs(['dsl']);
    expect(res.command).eql('dsl');
    expect(res._).eql(['dsl']);
  });

  it('does not accept removed fn command', () => {
    const res = parseArgs(['fn', 'x']);
    expect(res.command).eql(undefined);
    expect(res._).eql(['fn', 'x']);
  });

  it('does not accept removed branded alias', () => {
    const res = parseArgs(['ƒ', 'x']);
    expect(res.command).eql(undefined);
    expect(res._).eql(['ƒ', 'x']);
  });

  it('does not accept removed short alias', () => {
    const res = parseArgs(['f', 'x']);
    expect(res.command).eql(undefined);
    expect(res._).eql(['f', 'x']);
  });

  it('leaves command undefined when first positional is not a tool', () => {
    const res = parseArgs(['nope', 'x']);
    expect(res.command).eql(undefined);
    expect(res._).eql(['nope', 'x']);
  });

  it('does not treat flags themselves as commands', () => {
    const res = parseArgs(['--help', 'serve']);
    expect(res.help).eql(true);
    expect(res.command).eql('serve');
    expect(res._).eql(['serve']);
  });

  it('binds command when help is present after command', () => {
    const res = parseArgs(['serve', '-h']);
    expect(res.help).eql(true);
    expect(res.command).eql('serve');
    expect(res._).eql(['serve']);
  });

  it('parses --no-upgrade-check as a root-only advisory flag', () => {
    const res = parseArgs(['--no-upgrade-check', 'pi']);
    expect(res.noUpgradeCheck).eql(true);
    expect(res.command).eql('pi');
    expect(res._).eql(['pi']);
  });

  it('normalizes the first positional alias even when root flags come first', () => {
    const res = parseArgs(['--no-upgrade-check', 'agent', 'x']);
    expect(res.command).eql('pi');
    expect(res._).eql(['pi', 'x']);
  });

  it('creates child argv with the command first and strips root-only advisory flags', () => {
    const res = parseArgs(['--no-upgrade-check', 'agent', '--help']);
    expect(toRootDispatchArgv(['--no-upgrade-check', 'agent', '--help'], res)).eql([
      'pi',
      '--help',
    ]);
  });

  it('strips the root-only advisory flag after the command too', () => {
    const res = parseArgs(['pi', '--no-upgrade-check', '--flag']);
    expect(toRootDispatchArgv(['pi', '--no-upgrade-check', '--flag'], res)).eql([
      'pi',
      '--flag',
    ]);
  });

  it('does not strip root-only advisory flag text after the positional separator', () => {
    const res = parseArgs(['pi', '--', '--no-upgrade-check']);
    expect(toRootDispatchArgv(['pi', '--', '--no-upgrade-check'], res)).eql([
      'pi',
      '--',
      '--no-upgrade-check',
    ]);
  });
});
