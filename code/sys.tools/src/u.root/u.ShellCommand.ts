export const ShellCommand = `
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
