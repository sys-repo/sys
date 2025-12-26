export const ShellCommand = `
  # ----------------------------------------------------------------------
  # @sys: tools
  # ----------------------------------------------------------------------
  sys() {
    emulate -L zsh

    local cmd="\${1-}"
    if [[ -z "$cmd" || "$cmd" == -* || "$cmd" != [A-Za-z0-9._-]## ]]; then
      echo "usage: sys <tool> [args...]" 1>&2
      return 1
    fi
    shift

    deno run -A "jsr:@sys/tools/\${cmd}" "\$@"
  }
`;
