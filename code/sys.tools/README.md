# @sys/tools
Common system tools index (with Programmatic and CLI entry-points).


```bash
System Tools
 ├─ @sys/tools          <version>
 ├─ @sys/tools/copy     (← alias cp, clipboard)
 ├─ @sys/tools/crdt
 ├─ @sys/tools/fs
 ├─ @sys/tools/video
 └─ @sys/tools/update
```

<p>&nbsp;</p>

## Installation

Initial `install` and `update` to latest with:
```bash
deno run --reload jsr:@sys/tools
```

View base library help (including command for `~/.zhcrc` file if desired):
```
deno run -E jsr:@sys/tools --help
```

<p>&nbsp;</p>

---
<p>&nbsp;</p>

## Tools

#### Video Tools
```bash
deno run -A jsr:@sys/tools/video
```


#### Copy to Clipboard Tools
```bash
deno run -A jsr:@sys/tools/copy
deno run -A jsr:@sys/tools/cp
```

#### CRDT Tools
```bash
deno run -A jsr:@sys/tools/crdt
```

#### Filesystem Tools
```bash
deno run -A jsr:@sys/tools/fs
```

#### Update Tools
```bash
deno run -A jsr:@sys/tools/update
```



<p>&nbsp;</p>

## Shell Alias
To enable the `sys` command globally, add the following snippet to your `~/.zshrc` file:

```bash
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
    deno run -A "jsr:@sys/tools/${sub}" "${@:2}"
  }
  ```
