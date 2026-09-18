import { describe, expect, it } from '../../-test.ts';
import { type t } from '../common.ts';
import { Shell } from '../mod.ts';

const owner: t.Shell.Owner = {
  id: '@sys.shell',
  label: '@sys/tools shell',
  commandHint: 'sys shell',
};

describe('Shell.Alias', () => {
  it('lists the sys alias as the first common alias set member', () => {
    expect(Shell.Alias.list()).to.eql([
      {
        id: 'sys',
        name: 'sys',
        command: 'deno run -A jsr:@sys/tools',
        risk: 'safe',
      },
    ]);
    expect(Shell.Alias.get('sys')).to.eql(Shell.Alias.list()[0]);
    expect(Shell.Alias.group('sys')).to.eql([Shell.Alias.list()[0]]);
    expect(Shell.Alias.group('common')).to.eql([Shell.Alias.list()[0]]);
  });
});

describe('Shell.Path', () => {
  it('lists the guarded Deno PATH entry', () => {
    expect(Shell.Path.list()).to.eql([
      {
        id: 'deno',
        label: 'Deno bin',
        expression: `export DENO_INSTALL="\${DENO_INSTALL:-$HOME/.deno}"
case ":$PATH:" in
  *":$DENO_INSTALL/bin:"*) ;;
  *) export PATH="$DENO_INSTALL/bin:$PATH" ;;
esac`,
      },
    ]);
    expect(Shell.Path.get('deno')).to.eql(Shell.Path.list()[0]);
  });

  it('renders catalog entries through the managed block helper', () => {
    const block = Shell.Block.render({
      owner,
      model: {
        aliases: Shell.Alias.group('common'),
        paths: [Shell.Path.get('deno')!],
      },
    });

    const markers = Shell.Block.markers(owner);
    expect(block).to.eql(`${markers.start}
# Generated settings. Do not manually edit. Update with \`sys shell\`.

# path: deno
export DENO_INSTALL="\${DENO_INSTALL:-$HOME/.deno}"
case ":$PATH:" in
  *":$DENO_INSTALL/bin:"*) ;;
  *) export PATH="$DENO_INSTALL/bin:$PATH" ;;
esac

# alias: sys
alias sys="deno run -A jsr:@sys/tools"

${markers.end}
`);
  });
});
