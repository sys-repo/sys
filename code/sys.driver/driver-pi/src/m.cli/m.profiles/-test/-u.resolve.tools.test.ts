import { describe, expect, it } from '../../../-test.ts';
import { resolveActiveToolNames } from '../u/u.resolve.tools.ts';

const SOURCE = {
  builtin: ['read', 'bash', 'edit', 'write', 'grep', 'find', 'ls'],
  extension: ['remove', 'copy'],
};

describe(`@sys/driver-pi/cli/Profiles/u.resolve.tools`, () => {
  it('resolveActiveToolNames → renders only registered explicit tools after exclusion', () => {
    const tools = resolveActiveToolNames({
      args: ['--tools', 'read,bash,remove,missing', '--exclude-tools', 'bash'],
      source: SOURCE,
    });

    expect(tools).to.eql(['read', 'remove']);
  });

  it('resolveActiveToolNames → accepts upstream selector aliases', () => {
    const tools = resolveActiveToolNames({
      args: ['-t', 'read,bash', '-xt', 'bash'],
      source: SOURCE,
    });

    expect(tools).to.eql(['read']);
  });

  it('resolveActiveToolNames → preserves no-tools and no-builtin tool semantics', () => {
    const noTools = resolveActiveToolNames({ args: ['--no-tools'], source: SOURCE });
    const noBuiltins = resolveActiveToolNames({
      args: ['--no-builtin-tools'],
      source: SOURCE,
    });
    const explicitWins = resolveActiveToolNames({
      args: ['--no-tools', '--tools', 'read'],
      source: SOURCE,
    });

    expect(noTools).to.eql([]);
    expect(noBuiltins).to.eql(['remove', 'copy']);
    expect(explicitWins).to.eql(['read']);
  });

  it('resolveActiveToolNames → follows Pi for repeated and value-less selectors', () => {
    const trailingExclude = resolveActiveToolNames({
      args: ['--tools', 'read,bash', '--exclude-tools', 'bash', '--exclude-tools'],
      source: SOURCE,
    });
    const consumedNoBuiltins = resolveActiveToolNames({
      args: ['--tools', '--no-builtin-tools'],
      source: SOURCE,
    });
    const consumedAlias = resolveActiveToolNames({ args: ['-xt', '-nbt'], source: SOURCE });
    const repeatedTools = resolveActiveToolNames({
      args: ['--tools', 'read', '--tools', 'bash'],
      source: SOURCE,
    });
    const consumedByModel = resolveActiveToolNames({
      args: ['--model', '--tools', 'read'],
      source: SOURCE,
    });

    expect(trailingExclude).to.eql(undefined);
    expect(consumedNoBuiltins).to.eql([]);
    expect(consumedAlias).to.eql(undefined);
    expect(repeatedTools).to.eql(['bash']);
    expect(consumedByModel).to.eql(undefined);
  });

  it('resolveActiveToolNames → omits unparsed assignments and argument errors', () => {
    const assignment = resolveActiveToolNames({ args: ['--tools=read'], source: SOURCE });
    const assignmentAfterSelection = resolveActiveToolNames({
      args: ['--tools', 'read', '--tools=remove'],
      source: SOURCE,
    });
    const missingExclusion = resolveActiveToolNames({
      args: ['--tools', 'read', '--exclude-tools'],
      source: SOURCE,
    });
    const missingModel = resolveActiveToolNames({
      args: ['--no-builtin-tools', '--model'],
      source: SOURCE,
    });
    const diagnostic = resolveActiveToolNames({
      args: ['-unknown', '--tools', 'read'],
      source: SOURCE,
    });
    const afterTerminator = resolveActiveToolNames({
      args: ['--', '--tools', 'read'],
      source: SOURCE,
    });

    expect(assignment).to.eql(undefined);
    expect(assignmentAfterSelection).to.eql(undefined);
    expect(missingExclusion).to.eql(undefined);
    expect(missingModel).to.eql(undefined);
    expect(diagnostic).to.eql(undefined);
    expect(afterTerminator).to.eql(undefined);
  });

  it('resolveActiveToolNames → omits detail when Pi settings determine the defaults', () => {
    const tools = resolveActiveToolNames({ args: [], source: SOURCE });

    expect(tools).to.eql(undefined);
  });
});
