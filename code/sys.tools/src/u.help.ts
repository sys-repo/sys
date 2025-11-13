import { type t, Args, c, Fmt, pkg } from './common.ts';

export async function printHelp(argv: string[]) {
  const args = Args.parse<t.ToolsCliArgs>(argv, { alias: { h: 'help' } });

  const text = await Fmt.help('System Tools', (e, c) => {
    const fmt = (path: string) => c.gray(`${pkg.name}/`) + path;
    e.row(fmt('copy'), c.gray(`(← alias ${c.white('cp')}, ${c.italic(c.yellow('clipboard'))})`));
    e.row(fmt('crdt'));
    e.row(fmt('fs'));
    e.row(fmt('video'));
    e.row(fmt('update'));
  });

  console.info(text);

  if (args.help) {
    const msg = `To enable the ${c.bold(c.cyan('sys'))} command globally, add the following snippet to your ${c.cyan('~/.zshrc')} file:`;
    console.info(msg);
    console.info(c.italic(c.yellow(BashCommand)));
  }
}

const BashCommand = `
  # ------------------------------------------------------------------------
  # @sys: tools
  # ------------------------------------------------------------------------
  alias sys-update='deno run -A --reload jsr:@sys/tools'
  sys() {
    # Run the root tool if there are no arguments or if the first argument is a flag
    if (( $# == 0 )) || [[ "$1" == -* ]]; then
      deno run -A jsr:@sys/tools "$@"
      return
    fi

    # Otherwise, treat the first argument as the subcommand
    local sub="$1"
    deno run -A "jsr:@sys/tools/\${sub}" "\${@:2}"
  }
  `;
