import { describe, expect, it, Str } from '../../-test.ts';
import { type t } from '../common.ts';
import { Shell } from '../mod.ts';

const owner: t.Shell.Owner = {
  id: '@sys.shell',
  label: '@sys/tools shell',
  commandHint: 'sys shell ...',
};

const model: t.Shell.ManagedModel = {
  paths: [
    {
      id: 'deno',
      label: 'deno',
      expression:
        'export DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"\ncase ":$PATH:" in\n  *":$DENO_INSTALL/bin:"*) ;;\n  *) export PATH="$DENO_INSTALL/bin:$PATH" ;;\nesac',
    },
  ],
  aliases: [
    { id: 'sys', name: 'sys', command: 'deno run -A jsr:@sys/tools', risk: 'safe' },
  ],
};

describe('Shell.Block', () => {
  it('renders a deterministic managed block', () => {
    const block = Shell.Block.render({ owner, model });
    expect(block).to.eql(`# >>> @sys/tools shell
# Managed by @sys/tools shell. Edit with: sys shell ...

# @sys.shell path deno
export DENO_INSTALL="\${DENO_INSTALL:-$HOME/.deno}"
case ":$PATH:" in
  *":$DENO_INSTALL/bin:"*) ;;
  *) export PATH="$DENO_INSTALL/bin:$PATH" ;;
esac

# @sys.shell alias sys
alias sys="deno run -A jsr:@sys/tools"

# <<< @sys/tools shell
`);
  });

  it('detects missing and present managed block states', () => {
    const missing = Shell.Block.detect({ owner, text: '# user content\n' });
    expect(missing).to.eql({ kind: 'missing' });

    const block = Shell.Block.render({ owner, model });
    const present = Shell.Block.detect({ owner, text: `# user content\n\n${block}` });
    expect(present.kind).to.eql('present');
    if (present.kind !== 'present') throw new Error('Expected present block state');
    expect(present.stale).to.eql(false);
    expect(present.model.aliases).to.eql(model.aliases);
    expect(present.model.paths).to.eql(model.paths);
  });

  it('adds a missing managed block without changing unmanaged content', () => {
    const before = '# user content\n';
    const result = Shell.Block.update({ owner, model, text: before });

    expect(result.kind).to.eql('add');
    expect(result.changed).to.eql(true);
    expect(result.nextText.startsWith('# user content\n\n# >>> @sys/tools shell')).to.eql(true);
    expect(result.nextText.endsWith('# <<< @sys/tools shell\n')).to.eql(true);
  });

  it('replaces one complete managed block only', () => {
    const before = `before\n\n${
      Shell.Block.render({
        owner,
        model: { paths: [], aliases: [] },
      })
    }after\n`;
    const result = Shell.Block.update({ owner, model, text: before });

    expect(result.kind).to.eql('replace');
    expect(result.changed).to.eql(true);
    expect(result.nextText.startsWith('before\n\n# >>> @sys/tools shell')).to.eql(true);
    expect(result.nextText.endsWith('# <<< @sys/tools shell\nafter\n')).to.eql(true);
  });

  it('removes one complete managed block only', () => {
    const before = `before\n${Shell.Block.render({ owner, model })}after\n`;
    const result = Shell.Block.remove({ owner, text: before });

    expect(result.kind).to.eql('remove');
    expect(result.changed).to.eql(true);
    expect(result.nextText).to.eql('before\nafter\n');
  });

  it('fails safe for partial or multiple markers', () => {
    const partial = Shell.Block.update({ owner, model, text: '# >>> @sys/tools shell\n' });
    expect(partial.block).to.eql({ kind: 'invalid', reason: 'partial-markers' });
    expect(partial.changed).to.eql(false);

    const reversed = Shell.Block.update({
      owner,
      model,
      text: '# <<< @sys/tools shell\n# >>> @sys/tools shell\n',
    });
    expect(reversed.block).to.eql({ kind: 'invalid', reason: 'partial-markers' });
    expect(reversed.changed).to.eql(false);

    const block = Shell.Block.render({ owner, model });
    const multiple = Shell.Block.update({ owner, model, text: `${block}${block}` });
    expect(multiple.block).to.eql({ kind: 'invalid', reason: 'multiple-blocks' });
    expect(multiple.changed).to.eql(false);
  });

  it('requires exact marker lines', () => {
    const result = Shell.Block.update({
      owner,
      model,
      text: '# >>> @sys/tools shell extra\n# <<< @sys/tools shell\n',
    });
    expect(result.block).to.eql({ kind: 'invalid', reason: 'partial-markers' });
    expect(result.changed).to.eql(false);
  });

  it('marks unknown manual edits inside the managed block as stale', () => {
    const text = Str.replaceAll(
      Shell.Block.render({ owner, model }),
      '# @sys.shell alias sys\n',
      '# manual edit\n# @sys.shell alias sys\n',
    ).after;
    const state = Shell.Block.detect({ owner, text });

    expect(state.kind).to.eql('present');
    if (state.kind !== 'present') throw new Error('Expected present block state');
    expect(state.stale).to.eql(true);

    const result = Shell.Block.update({ owner, model, text });
    expect(result.warnings).to.eql(['Managed shell block has manual edits and will be normalized']);
  });

  it('preserves CRLF newline style when updating', () => {
    const before = 'before\r\n';
    const result = Shell.Block.update({ owner, model: { paths: [], aliases: [] }, text: before });

    expect(result.nextText.includes('\r\n# >>> @sys/tools shell\r\n')).to.eql(true);
    expect(result.nextText.includes('\n# >>> @sys/tools shell\n')).to.eql(false);
  });
});
