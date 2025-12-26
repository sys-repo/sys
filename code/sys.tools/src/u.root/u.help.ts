import { type t, Args, c, Fmt, pkg, Str } from './common.ts';

export async function printRootHelp(argv: string[]) {
  const args = Args.parse<t.Tools.CliArgs>(argv, { alias: { h: 'help' } });

  const text = await Fmt.help(' system:tools', (e, c) => {
    const fmt = (tool: t.Tools.Command) => c.gray(c.dim(`${pkg.name}/`)) + tool;
    const add = (tool: t.Tools.Command, alias?: string) => {
      const items = [fmt(tool)];
      if (alias) items.push(c.gray(`(← alias ${c.white(alias)})`));
      e.row(...items);
    };
    add('copy', 'cp');
    add('crdt');
    add('serve');
    add('deploy');
    add('fs');
    add('video');
    add('update', 'up');
  });

  console.info(text);

  if (args.help) {
    const sys = c.bold(c.green('sys'));
    const cmd = c.white('deno run jsr:@sys/tools');
    const str = Str.builder()
      .line(`  Installs ${sys} as a lightweight shell alias over the raw`)
      .line(`  ${c.bold(cmd)} command. For convenience, you may`)
      .line(`  want to add it to your ${c.cyan('~/.zshrc')} or an equivalent file`);
    console.info(c.italic(c.gray(String(str))));
    console.info(c.yellow(ShellCommand));
  }
}

const ShellCommand = `
  # ------------------------------------------------------------------------
  # @sys: tools
  # ------------------------------------------------------------------------
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
